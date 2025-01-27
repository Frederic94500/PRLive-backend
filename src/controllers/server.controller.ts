import { Request, Response } from 'express';

import Container from "typedi"
import { ServerService } from "@/services/server.service"
import { sendJSON } from "@/utils/toolbox"

export class ServerController {
  public serverService = Container.get(ServerService)

  public createServer = async (req: Request, res: Response) => {
    try {
      const data = req.body
      await this.serverService.createServer(data)

      sendJSON(res, 201, 'Server created')
    } catch (error) {
      sendJSON(res, error.status, error);
    }
  }

  public getServer = async (req: Request, res: Response) => {
    try {
      const id = req.params.id
      const server = await this.serverService.getServer(id)

      sendJSON(res, 200, server)
    } catch (error) {
      sendJSON(res, error.status, error.message)
    }
  }

  public getServers = async (req: Request, res: Response) => {
    try {
      const servers = await this.serverService.getServers()

      sendJSON(res, 200, servers)
    } catch (error) {
      sendJSON(res, error.status, error.message)
    }
  }

  public editServer = async (req: Request, res: Response) => {
    try {
      const id = req.params.id
      const data = req.body
      await this.serverService.editServer(id, data)

      sendJSON(res, 200, 'Server updated')
    } catch (error) {
      sendJSON(res, error.status, error.message)
    }
  }

  public deleteServer = async (req: Request, res: Response) => {
    try {
      const id = req.params.id
      await this.serverService.deleteServer(id)

      sendJSON(res, 200, 'Server deleted')
    } catch (error) {
      sendJSON(res, error.status, error.message)
    }
  }
}
