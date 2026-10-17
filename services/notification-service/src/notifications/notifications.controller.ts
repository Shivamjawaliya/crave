import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('Notification Microservice')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('users/:userId')
  @ApiOperation({ summary: 'List user notifications' })
  getUserNotifications(@Param('userId') userId: string) {
    return this.notificationsService.getUserNotifications(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Dispatch manual notification' })
  sendNotification(@Body() body: { userId: string; type: string; payload: any }) {
    return this.notificationsService.sendManualNotification(body.userId, body.type, body.payload);
  }
}
