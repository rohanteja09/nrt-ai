"use client";

import { motion } from "framer-motion";

// Real, well-established annual astronomical events (meteor shower peaks and
// solstice/equinox dates are stable year to year) — deliberately not
// one-off claims like planetary oppositions or comet returns, which need
// live ephemeris data to state accurately.
const EVENTS = [
  { icon: "☄️", name: "Perseid Meteor Shower", date: "Aug 12", ring: "from-amber-400 to-orange-600" },
  { icon: "\u{1F342}", name: "Autumnal Equinox", date: "Sep 22", ring: "from-emerald-400 to-teal-600" },
  { icon: "☄️", name: "Orionid Meteor Shower", date: "Oct 21", ring: "from-blue-400 to-indigo-600" },
  { icon: "☄️", name: "Leonid Meteor Shower", date: "Nov 17", ring: "from-purple-400 to-fuchsia-600" },
  { icon: "☄️", name: "Geminid Meteor Shower", date: "Dec 13", ring: "from-cyan-400 to-blue-600" },
  { icon: "❄️", name: "Winter Solstice", date: "Dec 21", ring: "from-sky-400 to-blue-700" },
];

export default function SpaceEvents() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/40 p-3 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">Solar System Events</span>
        <a
          href="https://www.timeanddate.com/astronomy/night/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-medium text-blue-400 hover:text-blue-300"
        >
          View all &rarr;
        </a>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {EVENTS.map((e) => (
          <div
            key={e.name}
            className="flex min-w-[148px] shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2"
          >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${e.ring} text-xs`}>
              {e.icon}
            </span>
            <div className="min-w-0">
              <div className="truncate text-xs font-medium text-white">{e.name}</div>
              <div className="text-[10px] text-white/50">{e.date}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
