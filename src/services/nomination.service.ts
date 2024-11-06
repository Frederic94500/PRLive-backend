import { HttpException } from "@/exceptions/httpException";
import { NominationData } from "@/interfaces/nomination.interface";
import { PRModel } from "@/models/pr.model";
import { PRService } from "./pr.service";
import { Service } from "typedi";
import { Song } from "@/interfaces/song.interface";

@Service()
export class NominationService {
  private prService = new PRService();
  
  public async getNomination(prId: string, userId: string): Promise<NominationData> {
    const pr = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, `PR doesn't exist`);
    }
    
    const remainingNominations = pr.nomination.songPerUser - pr.nomination.nominatedSongList.filter(nominated => nominated.nominatedId === userId).length;
    const songList = pr.songList && !pr.nomination.hideNominatedSongList && (pr.nomination.hidden || pr.nomination.blind) ? pr.songList.map(song => {
      const { uuid, orderId, nominatedId, artist, title, anime, type, urlVideo, urlAudio } = song;
      return {
        uuid,
        orderId,
        nominatedId: pr.nomination.hidden ? nominatedId : undefined,
        artist: pr.nomination.blind ? undefined : artist,
        title: pr.nomination.blind ? undefined : title,
        anime: pr.nomination.blind ? undefined : anime,
        type,
        urlVideo: pr.nomination.blind ? undefined : urlVideo,
        urlAudio: pr.nomination.blind ? undefined : urlAudio,
      };
    }) : [];

    return {
      _id: pr.nomination._id,
      prId: pr.nomination.prId,
      hidden: pr.nomination.hidden,
      blind: pr.nomination.blind,
      hideNominatedSongList: pr.nomination.hideNominatedSongList,
      deadlineNomination: pr.nomination.deadlineNomination,
      endNomination: pr.nomination.endNomination,
      songPerUser: pr.nomination.songPerUser,
      remainingNominations,
      songList,
    };
  }

  public async nominate(prId: string, userId: string, songData: Song) {
    const pr = await PRModel.findById(prId);
    if (!pr) {
      throw new HttpException(404, `PR doesn't exist`);
    }
    if (!pr.nomination) {
      throw new HttpException(404, `This PR is not a nomination`);
    }
    if (pr.nomination.endNomination) {
      throw new HttpException(400, `Nomination is closed`);
    }
    if (pr.nomination.songPerUser <= pr.nomination.nominatedSongList.filter(nominated => nominated.nominatedId === userId).length) {
      throw new HttpException(400, `You have already nominated the maximum number of songs`);
    }

    songData.nominatedId = userId;

    this.prService.addSongPR(prId, songData);
  }
}
