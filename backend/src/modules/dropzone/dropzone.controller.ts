import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { Response } from 'express';
import * as path from 'path';
import { DropZoneService } from './dropzone.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('DropZone')
@Controller('dropzone')
export class DropZoneController {
  constructor(private readonly dropzoneService: DropZoneService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload an ephemeral or stash file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        expiryHours: { type: 'number', example: 24 },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('expiryHours') expiryHours: number,
    @Req() req: any,
  ) {
    const userId = req.user ? req.user.id : undefined;
    return this.dropzoneService.saveFile(file, userId, expiryHours);
  }

  @Get('file/:filename')
  @ApiOperation({ summary: 'Download or view uploaded file' })
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    const { record, filePath } = await this.dropzoneService.findFile(filename);
    res.setHeader('Content-Type', record.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${record.name}"`);
    return res.sendFile(filePath);
  }

  @Get('my-files')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List current user uploaded files' })
  listUserFiles(@Req() req: any) {
    return this.dropzoneService.listUserFiles(req.user.id);
  }

  @Delete('file/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete file' })
  deleteFile(@Req() req: any, @Param('id') id: string) {
    return this.dropzoneService.deleteFile(id, req.user.id);
  }
}
