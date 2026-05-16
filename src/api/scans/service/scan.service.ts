import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { scan_details, summary_scans } from '../entity/scan.entity';
import { SupabaseService } from '../../../common/supabase/supabase.service';
import { ScanStatus, ScanType } from '../enum/scan.enum';
import { CreateScanDto } from '../dto/create-scan.dto';

@Injectable()
export class ScanService {
  constructor(
    @InjectRepository(scan_details)
    private readonly scanDetailsRepo: Repository<scan_details>,
    @InjectRepository(summary_scans)
    private readonly summaryScansRepo: Repository<summary_scans>,
    private readonly supabaseService: SupabaseService,
  ) {}

  private resolveScanTotals(
    dto: CreateScanDto,
    actualFileCount: number,
    actualMalwareCount: number,
  ): {
    totalFilesScanned: number;
    totalMalwareDetected: number;
  } {
    const isUploadFile = dto.scanType === ScanType.UPLOAD_FILE;
    // UPLOAD_FILE: override dengan nilai aktual dari file yang benar-benar diterima
    if (isUploadFile) {
      if (actualFileCount !== 1) {
        throw new BadRequestException(
          `File yang diupload tidak boleh lebih dari 1.`,
        );
      }

      if (actualFileCount !== dto.totalFiles) {
        throw new BadRequestException(
          `File yang diupload (${actualFileCount}) tidak sesuai dengan total files yang dilaporkan (${dto.totalFiles}).`,
        );
      }
      if (dto.totalMalware !== undefined && dto.totalMalware !== 1)
        throw new BadRequestException(
          `total malware tidak boleh lebih dari total files. `,
        );

      return {
        totalFilesScanned: actualFileCount,
        totalMalwareDetected: actualMalwareCount,
      };
    }

    // FULL_SCAN: validasi hard-rule sebelum mempercayai data dari Desktop
    const reportedMalware = dto.totalMalware ?? 0;
    const totalFiles = dto.totalFiles;

    if (reportedMalware > totalFiles)
      throw new BadRequestException(
        `total malware (${reportedMalware}) tidak boleh lebih besar dari total files (${totalFiles}).`,
      );

    if (totalFiles > actualFileCount)
      throw new BadRequestException(
        `total files (${totalFiles}) tidak boleh lebih besar dari file yang diupload (${actualFileCount}).`,
      );

    // Jika file yang diupload adalah malware, jumlahnya harus cocok dengan totalMalware
    if (
      actualMalwareCount > 0 &&
      dto.totalMalware !== undefined &&
      actualFileCount !== reportedMalware
    )
      throw new BadRequestException(
        `File malware yang diupload (${actualFileCount}) tidak sesuai dengan totalMalware yang dilaporkan (${reportedMalware}).`,
      );

    return {
      totalFilesScanned: dto.totalFiles,
      totalMalwareDetected: reportedMalware,
    };
  }

  async createScanWithUpload(files: Express.Multer.File[], dto: CreateScanDto) {
    const isMalware = dto.isMalware ?? true;
    const folderName = isMalware ? 'malware' : 'benign';
    const actualFileCount = files.length;
    const actualMalwareCount = isMalware ? actualFileCount : 0;

    const { totalFilesScanned, totalMalwareDetected } = this.resolveScanTotals(
      dto,
      actualFileCount,
      actualMalwareCount,
    );

    // 1. Simpan summary ke database
    const savedSummary = await this.summaryScansRepo.save(
      this.summaryScansRepo.create({
        user_id: dto.userId,
        scan_type: dto.scanType,
        status: ScanStatus.COMPLETED,
        total_files_scanned: totalFilesScanned,
        total_malware_detected: totalMalwareDetected,
      }),
    );

    // 2. Upload semua file ke Supabase (untuk keperluan dataset ML)
    await Promise.all(
      files.map((file) =>
        this.supabaseService.uploadScanImage(file, folderName),
      ),
    );

    // 3. Catat detail hanya untuk file malware
    const savedDetails = isMalware
      ? await this.scanDetailsRepo.save(
          files.map((file) =>
            this.scanDetailsRepo.create({
              summary_id: savedSummary.id,
              file_name: file.originalname,
              is_malware: true,
            }),
          ),
        )
      : [];

    return {
      summary: savedSummary,
      details: savedDetails,
    };
  }

  // Ambil 1 sesi scan beserta semua detailnya (1 query JOIN)
  async getScanResult(id: number) {
    const result = await this.summaryScansRepo.findOne({
      where: { id },
      relations: ['details'],
    });

    if (!result) throw new BadRequestException('Summary not found');

    return result;
  }

  // Ambil semua riwayat scan milik 1 user, beserta detailnya
  async getMyScanHistory(userId: number) {
    return this.summaryScansRepo.find({
      where: { user_id: userId },
      relations: ['details'],
      order: { created_at: 'DESC' },
    });
  }
}
