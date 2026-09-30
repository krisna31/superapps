import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ShortlinksModule } from './modules/shortlinks/shortlinks.module';
import { NotesModule } from './modules/notes/notes.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { HabitsModule } from './modules/habits/habits.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { SnippetsModule } from './modules/snippets/snippets.module';
import { DropZoneModule } from './modules/dropzone/dropzone.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ShortlinksModule,
    NotesModule,
    ExpensesModule,
    HabitsModule,
    TasksModule,
    SnippetsModule,
    DropZoneModule,
    SettingsModule,
  ],
})
export class AppModule {}
