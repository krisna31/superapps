import { Module } from '@nestjs/common';
import { DropZoneService } from './dropzone.service';
import { DropZoneController } from './dropzone.controller';
import { DropZoneGateway } from './dropzone.gateway';

@Module({
  controllers: [DropZoneController],
  providers: [DropZoneService, DropZoneGateway],
  exports: [DropZoneService],
})
export class DropZoneModule {}
