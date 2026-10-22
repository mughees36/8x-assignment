import type { Participant } from "@/lib/types";

export function AvatarStack({ people, max = 4 }: { people: Participant[]; max?: number }) {
  const visible = people.slice(0, max);
  return <div className="flex items-center" aria-label={`${people.length} participants`}>
    {visible.map((person, index) => <span key={person.id} title={person.name} className="grid size-7 place-items-center rounded-full border-2 border-white text-[9px] font-bold text-white" style={{ backgroundColor: person.color, marginLeft: index ? -7 : 0 }}>{person.initials}</span>)}
    {people.length > max && <span className="grid size-7 place-items-center rounded-full border-2 border-white bg-[#e8ece7] text-[9px] font-bold text-[#55625a]" style={{ marginLeft: -7 }}>+{people.length - max}</span>}
  </div>;
}
