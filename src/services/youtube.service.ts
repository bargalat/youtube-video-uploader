import { Injectable } from '@nestjs/common';
import { google, youtube_v3 } from 'googleapis';
import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';



@Injectable()
export class YoutubeService {
    private client: youtube_v3.Youtube;
    private oAuth2Client: any;
    private channel: any

    constructor(private readonly prismaService: PrismaClient, readonly clientID: string, readonly clientSecret: string, readonly redirectURI: string) {
        this.oAuth2Client = new google.auth.OAuth2(
            clientID,
            clientSecret,
            redirectURI
        );
    }

    async updateCredentials() {
        this.channel = await this.prismaService.channel.findFirst({
            where: {
                youtube_client_ID: this.clientID
            }
        });

        this.oAuth2Client.setCredentials({
            refresh_token: this.channel.refresh_token
        });

        return new Promise((resolve, reject) => {
            this.oAuth2Client.refreshAccessToken((err, tokens) => {
                if (!err) {
                    this.oAuth2Client.setCredentials({
                        refresh_token: this.channel.refresh_token,
                        access_token: tokens.access_token
                    });
                    this.client = google.youtube({
                        version: 'v3',
                        auth: this.oAuth2Client
                    });
                    resolve(this.client)
                } else {
                    reject("Error while creating the youtube client")
                }
            })
        })
    }

    async uploadVideo(title: string, description: string, videoPath: string) {
        try {
            if (!this.client) {
                await this.updateCredentials();
            }
            const response = await this.client.videos.insert({
                part: ['id', 'snippet', 'status'],
                notifySubscribers: false,
                requestBody: {
                    snippet: {
                        title: title,
                        description: description,
                    },
                    status: {
                        privacyStatus: 'public',
                        madeForKids: false,
                    },
                },
                media: {
                    body: fs.createReadStream(videoPath),
                },
            });

            return response.data;
        } catch (error) {
            console.error('Error uploading video:', error);
            throw error;
        }
    }
}
