import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { MessageWsService } from './message-ws.service';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors:true })
export class MessageWsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  
  constructor(
    private readonly messageWsService: MessageWsService
  ) {

  }
  handleConnection(client: Socket, ...args: any[]) {
    this.messageWsService.registerClient(client)
  }
  handleDisconnect(client: Socket, reason?: string) {
    this.messageWsService.removeClient(`${client.id} and the reason is: ${reason}`)
  }
}
