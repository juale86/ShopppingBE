import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { MessageWsService } from './message-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessage } from './dtos/new-message.dto';

@WebSocketGateway({ cors:true })
export class MessageWsGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer() wss: Server;
  
  constructor(
    private readonly messageWsService: MessageWsService
  ) {

  }
  handleConnection(client: Socket, ...args: any[]) {
    this.messageWsService.registerClient(client)
    this.wss.emit('clients-updated', this.messageWsService.getConnectedClients())
  }
  handleDisconnect(client: Socket, reason?: string) {
    this.messageWsService.removeClient(client.id)
    console.log(`${client.id} and the reason is: ${reason}`)
    this.wss.emit('clients-updated', this.messageWsService.getConnectedClients())
  }
  @SubscribeMessage('message-from-client')
  onMessageFromClient(client: Socket, payload: NewMessage) {
    client.emit('private-message-from-server', {
      fullName: 'Server',
      message: 'Message received',
      private: true,
    })
    client.broadcast.emit('private-message-from-server', {
      message: `El cliente ${client.id} ha dicho: ${payload.message}`
    })
    this.wss.emit('message-from-server', {
      fullName: client.id,
      message: payload.message
    })
  }
}
