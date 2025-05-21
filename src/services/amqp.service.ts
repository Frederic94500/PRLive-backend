import { Options, connect } from 'amqplib';
import { RABBITMQ_HOST, RABBITMQ_PASSWORD, RABBITMQ_PORT, RABBITMQ_QUEUE, RABBITMQ_USER } from '@/config';

const authOptions: Options.Connect = {
  protocol: 'amqp',
  hostname: RABBITMQ_HOST,
  port: parseInt(RABBITMQ_PORT),
  username: RABBITMQ_USER,
  password: RABBITMQ_PASSWORD,
}

export const amqpService = {
  async publish(message: string) {
    try {
      const connection = await connect(authOptions);
      const channel = await connection.createChannel();
      await channel.assertQueue(RABBITMQ_QUEUE, { durable: true });
      channel.sendToQueue(RABBITMQ_QUEUE, Buffer.from(message));
      console.log(`Message sent to queue ${RABBITMQ_QUEUE}: ${message}`);
      await channel.close();
      await connection.close();
    } catch (error) {
      console.error('Error publishing message: ', error);
    }
  },
};
