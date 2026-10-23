import { notFound } from "next/navigation";
import { getMeeting } from "@/lib/meetings";
import { getShareSnapshot } from "@/lib/local-ai/persistence";
import { PublicShare } from "@/components/public-share";
export const dynamic = "force-dynamic";
export default async function SharePage({params,searchParams}:{params:Promise<{meetingId:string}>;searchParams:Promise<{start?:string;end?:string;title?:string}>}){const key=(await params).meetingId;const seeded=getMeeting(key);let meeting=seeded;let token:string|undefined;if(!meeting){try{const snapshot=await getShareSnapshot(key);meeting=snapshot?.meeting;token=snapshot?.token}catch{}}if(!meeting)notFound();const q=await searchParams;const parsedStart=q.start===undefined?undefined:Number(q.start);const parsedEnd=q.end===undefined?undefined:Number(q.end);const start=Number.isFinite(parsedStart)?parsedStart:undefined;const end=Number.isFinite(parsedEnd)?parsedEnd:undefined;return <PublicShare meeting={{...meeting,mediaUrl:token?`/api/public/shares/${token}/audio`:meeting.mediaUrl}} start={start} end={end} title={q.title?.slice(0,100)}/>}
