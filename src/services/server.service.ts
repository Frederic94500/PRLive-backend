import { HttpException } from "@/exceptions/httpException";
import { PRModel } from "@/models/pr.model";
import { Server } from "@/interfaces/server.interface";
import { ServerModel } from "@/models/server.model";
import { Service } from "typedi";

@Service()
export class ServerService {
  public async createServer(data: Server): Promise<void> {
    const server: Server = await ServerModel.findOne({ discordId: data.discordId });
    if (server) throw new HttpException(409, "Server already exists");

    await ServerModel.create(data);
  }

  public async getServer(id: string): Promise<Server> {
    const server: Server = await ServerModel.findById(id);
    if (!server) throw new HttpException(404, "Server doesn't exist");
    
    return server;
  }

  public async getServers(): Promise<Server[]> {
    const servers: Server[] = await ServerModel.find();
    
    return servers;
  }

  public async editServer(id: string, data: Server): Promise<void> {
    const server: Server = await ServerModel.findById(id);
    if (!server) throw new HttpException(404, "Server doesn't exist");

    await ServerModel.findByIdAndUpdate(id, data);
  }

  public async deleteServer(id: string): Promise<void> {
    const server: Server = await ServerModel.findByIdAndDelete(id);
    if (!server) throw new HttpException(404, "Server doesn't exist");

    await PRModel.updateMany({ serverId: id }, { serverId: null });
  }
}
