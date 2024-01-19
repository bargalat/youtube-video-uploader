import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';
import { YoutubeService } from './youtube.service';
import { promises as fs } from 'fs';



@Injectable()
export class CronService {
    /**
     *
     */
    constructor(private readonly prismaService: PrismaClient) {
    }

    @Cron('0 0 * * *')
    async handleCron() {
        const channel = await this.prismaService.channel.findFirst({
            where: {
                status: true,
                source: "youtube"
            }
        });

        const youtube = new YoutubeService(this.prismaService, channel.youtube_client_ID, channel.youtube_client_secret, channel.youtube_redirect_URI);

        const filePath = channel.file_path;

        try {
            const files = await fs.readdir(filePath);
            let earliestFile = null;
            let earliestTime = Infinity;

            for (const file of files) {
                const directory = `${filePath}/${file}`;
                const stats = await fs.stat(directory); 

                if (stats.birthtime.getTime() < earliestTime) {
                    earliestTime = stats.birthtime.getTime();
                    earliestFile = file;
                }
            }

            if (!earliestFile) {
                throw new Error("Folder is empty.");
            } else {
                const videoName = earliestFile.replace(".mp4", ".txt")
                const videoPath = `${filePath}/${earliestFile}`
                const metadataFilePath = `${filePath}/metadata/${videoName}`
                const videoMetadata = JSON.parse(await fs.readFile(metadataFilePath, 'utf8')); 

                youtube.uploadVideo(videoMetadata.title, videoMetadata.description, videoPath);
            }
        } catch (err) {
            console.error(err);
        }
    }
}
