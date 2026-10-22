"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, LockKeyhole, Mic, ShieldCheck, XCircle } from "lucide-react";
import type { LocalAIReadiness } from "@/lib/local-ai/client-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Permission = "prompt" | "requesting" | "granted" | "denied" | "unsupported" | "no-device";
export function NewMeetingSetup() {
  const router = useRouter(); const [title, setTitle] = useState(""); const [permission, setPermission] = useState<Permission>("prompt");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]); const [deviceId, setDeviceId] = useState(""); const [readiness, setReadiness] = useState<LocalAIReadiness>();
  useEffect(() => { fetch("/api/local-ai/status", { cache: "no-store" }).then((response) => response.json()).then(setReadiness).catch(() => setReadiness(undefined)); }, []);
  async function requestMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setPermission("unsupported"); return; }
    setPermission("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); stream.getTracks().forEach((track) => track.stop());
      const all = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === "audioinput");
      setDevices(all); setDeviceId(all[0]?.deviceId ?? ""); setPermission(all.length ? "granted" : "no-device");
    } catch (error) { setPermission((error as DOMException).name === "NotFoundError" ? "no-device" : "denied"); }
  }
  function start() {
    const id = `session-${crypto.randomUUID()}`;
    sessionStorage.setItem(`local-meeting:${id}`, JSON.stringify({ title: title.trim(), deviceId, authorizedAt: Date.now() }));
    router.push(`/meetings/live/${id}`);
  }
  const valid = title.trim().length > 0 && title.trim().length <= 140 && permission === "granted" && readiness?.ready;
  return <div className="mx-auto max-w-3xl"><p className="text-xs font-semibold text-moss-700">PRIVATE LOCAL RECORDING</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Start an AI meeting</h1><p className="mt-3 text-sm leading-6 text-[#68766d]">Record from this browser, then transcribe and summarize entirely through services running on this Mac.</p>
    <div className="mt-7 grid gap-5 md:grid-cols-[1fr_280px]"><Card className="p-6"><label className="text-sm font-semibold">Meeting title<input autoFocus maxLength={140} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Weekly planning" className="mt-2 block w-full rounded-xl border px-3 py-3 text-sm outline-none"/></label>
      <div className="mt-6"><p className="text-sm font-semibold">Microphone</p><p className="mt-1 text-xs leading-5 text-[#748078]">Permission is requested only when you choose the button below.</p>{permission !== "granted" ? <Button className="mt-3" variant="outline" onClick={requestMicrophone} disabled={permission === "requesting"}>{permission === "requesting" ? <Loader2 className="animate-spin" size={15}/> : <Mic size={15}/>}Check microphone permission</Button> : <select aria-label="Microphone" value={deviceId} onChange={(event) => setDeviceId(event.target.value)} className="mt-3 w-full rounded-xl border bg-white px-3 py-3 text-sm">{devices.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Microphone ${index + 1}`}</option>)}</select>}
      {permission === "granted" && <Status good text="Microphone permission granted"/>}{permission === "denied" && <Status text="Microphone access was denied. Allow it in browser site settings, then try again."/>}{permission === "no-device" && <Status text="No audio input device was found."/>}{permission === "unsupported" && <Status text="This browser does not support MediaRecorder and microphone capture."/>}</div>
      <Button className="mt-7 w-full justify-center" onClick={start} disabled={!valid}>Start Meeting</Button></Card>
      <div className="space-y-4"><Card className="p-4"><div className="flex items-center gap-2"><ShieldCheck size={17} className="text-moss-700"/><h2 className="text-sm font-semibold">Local AI readiness</h2></div>{!readiness ? <p className="mt-3 text-xs text-[#748078]">Checking this Mac…</p> : <><Status good={readiness.ready} text={readiness.message}/><div className="mt-3 space-y-2">{Object.entries(readiness.checks).map(([name, check]) => <div key={name} title={check.detail} className="flex items-center gap-2 text-xs capitalize">{check.ready ? <CheckCircle2 size={13} className="text-moss-600"/> : <XCircle size={13} className="text-red-600"/>}{name}</div>)}</div></>}</Card><Card className="p-4"><LockKeyhole size={17} className="text-moss-700"/><h2 className="mt-3 text-sm font-semibold">Private by architecture</h2><p className="mt-2 text-xs leading-5 text-[#68766d]">Audio is stored under this project’s private <code>.data</code> directory. The browser never calls Ollama; the local Next.js server handles transcription and inference.</p><p className="mt-3 text-[11px] leading-5 text-[#8a958e]">{readiness?.deploymentNotice}</p></Card></div></div></div>;
}
function Status({ good = false, text }: { good?: boolean; text: string }) { return <p role="status" className={`mt-3 flex items-start gap-2 text-xs leading-5 ${good ? "text-moss-700" : "text-red-700"}`}>{good ? <CheckCircle2 className="mt-0.5 shrink-0" size={14}/> : <XCircle className="mt-0.5 shrink-0" size={14}/>}<span>{text}</span></p>; }
