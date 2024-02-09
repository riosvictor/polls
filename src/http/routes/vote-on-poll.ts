import z from "zod";
import { prisma } from "../../lib/prisma";
import { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { redis } from "../../lib/redis";
import { voting } from "../../utils/voting-pub-sub";

export async function voteOnPoll(app: FastifyInstance) {
  app.post('/polls/:pollId/votes', async (request, reply) => {
    let { sessionId } = request.cookies;
    const voteOnPollParams = z.object({
      pollId: z.string().uuid(),
    });
    const voteOnPollBody = z.object({
      pollOptionId: z. string().uuid(),
    });
  
    const { pollId } = voteOnPollParams.parse(request.params)
    const { pollOptionId } = voteOnPollBody.parse(request.body)

    if (sessionId){
      const userPreviousCoteOnPoll = await prisma.vote.findUnique({
        where: {
          sessionId_pollId: {
            sessionId,
            pollId
          }
        }
      })

      if (userPreviousCoteOnPoll && userPreviousCoteOnPoll.pollOptionId !== pollOptionId) {
        await prisma.vote.delete({
          where: {
            id: userPreviousCoteOnPoll.id
          }
        })

        const votes = await redis.zincrby(pollId, -1, userPreviousCoteOnPoll.pollOptionId);

        voting.publish(pollId, {
          pollOptionId: userPreviousCoteOnPoll.pollOptionId,
          votes: Number(votes)
        });
      } else if (userPreviousCoteOnPoll) {
        return reply.status(400).send({ message: 'User already voted on this poll' });
      }
    }
    
    if (!sessionId){
      sessionId = randomUUID()

      reply.setCookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        signed: true,
        httpOnly: true,
      })
    }
  
    await prisma.vote.create({
      data: {
        sessionId,
        pollId,
        pollOptionId,
      }
    })

    const votes = await redis.zincrby(pollId, 1, pollOptionId);

    voting.publish(pollId, {
      pollOptionId,
      votes: Number(votes)
    });
  
    return reply.status(201).send();
  });
}