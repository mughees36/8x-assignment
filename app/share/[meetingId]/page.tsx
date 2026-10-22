import { notFound } from "next/navigation";
import { getMeeting } from "@/lib/meetings";
import { PublicShare } from "@/components/public-share";
export default async function SharePage({params,searchParams}:{params:Promise<{meetingId:string}>;searchParams:Promise<{start?:string;end?:string;title?:string}>}){const meeting=getMeeting((await params).meetingId);if(!meeting)notFound();const q=await searchParams;const start=q.start===undefined?undefined:Number(q.start);const end=q.end===undefined?undefined:Number(q.end);return <PublicShare meeting={meeting} start={Number.isFinite(start)?start:undefined} end={Number.isFinite(end)?end:undefined} title={q.title}/>}
