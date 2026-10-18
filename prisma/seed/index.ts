/**
 * Demo seed. `npm run seed` loads the demo data into an empty database;
 * `npm run seed:reset` wipes every table first.
 */
import "dotenv/config";
import { PrismaClient, type CallType, type MomentType, type Prisma } from "@prisma/client";
import { accountManagerPath, habits, skills } from "./habits";
import { AGENCY_DOMAIN, FOUNDER, REP, founderCalls, repCalls, type CallSeed } from "./calls";
import { businessContextAnswers, businessContextProfile, placeholderClips, playbook } from "./content";

const db = new PrismaClient();
const MEDIA_URL = "/demo/sample-call.mp4";
const DAY = 24 * 60 * 60 * 1000;

const HABIT_EVIDENCE: Record<string, MomentType[]> = {
  H1: ["opening"], H2: ["opening"], H3: ["discovery_question"], H4: ["discovery_question"],
  H5: ["next_steps"], H7: ["value_story"], H8: ["value_story"], H9: ["objection"], H10: ["objection"],
  H11: ["next_steps"], H12: ["next_steps"], H13: ["discovery_question"], H14: ["value_story", "pricing"],
};

async function reset() {
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length) {
    await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`);
  }
}

type Turn = { speaker: string; email: string; startS: number; endS: number; text: string };

function buildTurns(seed: CallSeed) {
  const us = seed.role === "founder" ? FOUNDER : REP;
  const client = { name: seed.contact, email: `${seed.contact.toLowerCase()}@${seed.domain}` };
  let t = 0;
  const turns: (Turn & { moment?: MomentType })[] = seed.lines.map((line) => {
    const text = line.text.replaceAll("{n}", seed.contact).replaceAll("{c}", seed.company);
    const duration = Math.min(28, Math.max(6, Math.round(text.split(/\s+/).length / 2.5)));
    const who = line.us ? us : client;
    const turn = { speaker: who.name, email: who.email, startS: t, endS: t + duration, text, moment: line.moment };
    t += duration + 1;
    return turn;
  });
  return { turns, us, client, durationS: t };
}

const summarise = (text: string) => {
  const first = text.split(/(?<=[.?!])\s/)[0];
  return first.length > 90 ? `${first.slice(0, 87)}…` : first;
};

async function main() {
  const isReset = process.argv.includes("--reset");
  if (isReset) await reset();
  else if (await db.user.count()) {
    console.log("Database already has data. Run `npm run seed:reset` to wipe and reseed.");
    return;
  }

  const now = Date.now();

  await db.user.create({
    data: { name: FOUNDER.name, email: FOUNDER.email, currentView: "founder", onboardedAt: new Date(now - 130 * DAY) },
  });

  await db.businessContext.create({
    data: {
      version: 1,
      answers: businessContextAnswers,
      profileSummary: businessContextProfile,
      approvedAt: new Date(now - 129 * DAY),
      promptVersion: "seed",
    },
  });

  // Habits
  const habitIds: Record<string, string> = {};
  for (const [order, name] of skills.entries()) {
    await db.skill.create({ data: { name, order } });
  }
  for (const h of habits) {
    const created = await db.habit.create({
      data: {
        code: h.code,
        skill: { connect: { name: h.skill } },
        name: h.name,
        description: h.description,
        rubric: h.rubric,
        appliesToCallTypes: h.appliesTo,
        requiresObjection: h.requiresObjection ?? false,
        computed: h.computed ?? false,
        orderInPath: accountManagerPath.indexOf(h.code) + 1,
      },
    });
    habitIds[h.code] = created.id;
  }

  // Calls, moments and scorecards
  type Created = { id: string; seed: CallSeed; total: number; moments: { id: string; type: MomentType }[]; results: { habitCode: string; done: boolean }[] };
  const createCall = async (seed: CallSeed): Promise<Created> => {
    const { turns, us, client, durationS } = buildTurns(seed);
    const call = await db.call.create({
      data: {
        source: "fathom",
        fathomRecordingId: `demo-${seed.role}-${seed.title.replace(/\W+/g, "-").toLowerCase()}`,
        title: seed.title,
        startedAt: new Date(now - seed.daysAgo * DAY),
        durationS,
        transcript: turns.map((turn) => ({ speaker: turn.speaker, email: turn.email, startS: turn.startS, endS: turn.endS, text: turn.text })),
        attendeeEmails: [us.email, client.email],
        clientDomain: seed.domain,
        mediaUrl: MEDIA_URL,
        callType: seed.type,
        outcome: seed.outcome,
        role: seed.role,
        status: "ready",
      },
    });
    const moments: { id: string; type: MomentType }[] = [];
    for (const turn of turns.filter((t) => t.moment)) {
      const m = await db.moment.create({
        data: {
          callId: call.id,
          type: turn.moment!,
          startS: turn.startS,
          endS: turn.endS,
          speaker: turn.speaker,
          text: turn.text,
          summary: summarise(turn.text),
          context: { callType: seed.type },
        },
      });
      moments.push({ id: m.id, type: m.type });
    }

    // Scorecard: applicable habits per the spec's rules; H6 computed from talk time.
    const hasObjection = moments.some((m) => m.type === "objection");
    const applicable = habits.filter(
      (h) => h.appliesTo.includes(seed.type as CallType) && (!h.requiresObjection || hasObjection),
    );
    const clientTalk = turns.filter((t) => t.email === client.email).reduce((s, t) => s + t.endS - t.startS, 0);
    const allTalk = turns.reduce((s, t) => s + t.endS - t.startS, 0);
    const h6Done = clientTalk / allTalk > 0.5;
    const target = Math.round((seed.targetScore * applicable.length) / 100);
    const order = [...new Set([...(seed.role === "rep" ? ["H13"] : []), ...accountManagerPath])].filter((c) => c !== "H6");
    let remaining = target - (applicable.some((h) => h.code === "H6") && h6Done ? 1 : 0);
    const doneCodes = new Set<string>();
    for (const code of order) {
      if (remaining <= 0) break;
      if (applicable.some((h) => h.code === code)) {
        doneCodes.add(code);
        remaining--;
      }
    }
    const results = applicable.map((h) => {
      if (h.code === "H6") {
        return { habitCode: "H6", done: h6Done, evidenceMomentId: null, note: `Client talked ${Math.round((clientTalk / allTalk) * 100)}% of the time` };
      }
      const done = doneCodes.has(h.code);
      const evidence = moments.find((m) => HABIT_EVIDENCE[h.code]?.includes(m.type)) ?? moments[0];
      return done
        ? { habitCode: h.code, done, evidenceMomentId: evidence.id, note: h.name }
        : { habitCode: h.code, done, evidenceMomentId: null, note: "not_observed" };
    });
    const total = Math.round((results.filter((r) => r.done).length / results.length) * 100);
    await db.scorecard.create({
      data: {
        callId: call.id,
        callType: seed.type,
        total,
        habitResults: results,
        awarenessLevel: seed.type === "discovery" ? "problem_aware" : "product_aware",
        awarenessMatched: seed.role === "founder" ? seed.outcome !== "lost" : total >= 50,
        promptVersion: "seed",
      },
    });
    return { id: call.id, seed, total, moments, results };
  };

  const founder: Created[] = [];
  for (const seed of founderCalls) founder.push(await createCall(seed));
  const rep: Created[] = [];
  for (const seed of repCalls) rep.push(await createCall(seed));

  // Founder benchmark per call type, stored on every scorecard.
  const benchmark = (type: CallType) => {
    const scores = founder.filter((c) => c.seed.type === type).map((c) => c.total);
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  };
  for (const c of [...founder, ...rep]) {
    await db.scorecard.update({ where: { callId: c.id }, data: { benchmarkTotal: benchmark(c.seed.type) } });
  }

  // Rep self-reviews (the latest call is left unreviewed to demo the self-review gate) and feedback.
  const missed: Record<number, string[]> = {
    1: ["Harbour Health plans a new clinic site in the spring"],
    3: ["Atlas Logistics needs a driver recruitment campaign"],
    5: ["Loyalty app next year", "Expansion into Ireland"],
  };
  for (const [i, c] of rep.entries()) {
    if (i < rep.length - 1) {
      await db.selfReview.create({ data: { callId: c.id, rating: [3, 4, 3, 2, 4][i], redoNote: "Ask more questions before talking about our services." } });
    }
    const objection = c.moments.find((m) => m.type === "objection");
    const opportunityMoment = c.moments.find((m) => m.type === "buying_signal") ?? c.moments.at(-1)!;
    await db.feedback.create({
      data: {
        callId: c.id,
        strengths: ["Warm, confident opening", "Clear summary of the client's results"].slice(0, c.total >= 50 ? 2 : 1).concat("Good rapport with the client"),
        improvements: ["End with a dated next step", "Ask a question before answering objections"],
        objections: objection
          ? [{ momentId: objection.id, summary: "Cost or budget concern", repAnswer: "Apologised and explained the extra hours", founderAnswerItemId: null }]
          : [],
        missedOpportunities: (missed[i] ?? []).map((description) => ({ momentId: opportunityMoment.id, description })),
      },
    });
  }

  // Habit progress: H5 mastered (done on every rep call), H13 is the focus habit with its streak from rep account reviews.
  const h13Streak = rep
    .filter((c) => c.seed.type === "account_review")
    .map((c) => c.results.find((r) => r.habitCode === "H13")!.done)
    .slice(-5);
  for (const h of habits) {
    await db.habitProgress.create({
      data: {
        habitId: habitIds[h.code],
        isFocus: h.code === "H13",
        streak: h.code === "H13" ? h13Streak : [],
        masteredAt: h.code === "H5" ? new Date(now - 9 * DAY) : null,
        celebratedAt: h.code === "H5" ? new Date(now - 9 * DAY) : null,
      },
    });
  }

  // Playbook
  const won = (i: number) => founderCalls[i].outcome === "won";
  const playbookIds: string[] = [];
  for (const item of playbook) {
    const sourceMomentIds = item.sources.map(([i, type]) => founder[i].moments.find((m) => m.type === type)!.id);
    const winCount = new Set(item.sources.filter(([i]) => won(i)).map(([i]) => founderCalls[i].domain)).size;
    const created = await db.playbookItem.create({
      data: {
        type: item.type,
        title: item.title,
        content: item.content,
        sourceMomentIds,
        winCount,
        status: item.filterReason ? "filtered" : winCount >= 3 ? "proven" : "observed",
        filterReason: item.filterReason,
        origin: "seed",
      },
    });
    playbookIds.push(created.id);
  }

  // Placeholder clips
  for (const clip of placeholderClips) {
    await db.placeholderClip.create({ data: { ...clip, mediaUrl: MEDIA_URL } });
  }

  // Inbox
  const decision = (i: number) => founder[i].moments.find((m) => m.type === "decision")!;
  await db.inboxItem.create({
    data: {
      type: "why_prompt", title: "Why did you give a 10% discount to Northwind Retail?",
      body: "You offered 10% off the retainer in exchange for a 12-month term. What made that the right trade here?",
      priority: 90, dedupeKey: `why:${decision(2).id}`, sourceCallId: founder[2].id, sourceMomentId: decision(2).id,
    },
  });
  await db.inboxItem.create({
    data: {
      type: "why_prompt", title: "Why did you walk away from Cobalt Finance?",
      body: "Procurement asked for 15% off and you declined. What's your rule for when a discount is too deep?",
      priority: 80, dedupeKey: `why:${decision(10).id}`, sourceCallId: founder[10].id, sourceMomentId: decision(10).id,
    },
  });
  await db.inboxItem.create({
    data: {
      type: "open_question", title: "How do you answer \"Can we speak to a reference?\" before a proposal?",
      body: "No founder call in the playbook shows this moment yet, so reps have no example to follow.",
      priority: 60,
    },
  });
  const askInbox = await db.inboxItem.create({
    data: {
      type: "ask_founder", title: "Sam asked: \"What do I say when a client wants to pause the retainer for a month?\"",
      body: "Nothing in your playbook covers pausing a retainer. Your answer will be shown to Sam and added to the playbook.",
      priority: 70,
    },
  });
  await db.askQuestion.create({
    data: { question: "What do I say when a client wants to pause the retainer for a month?", routedToInbox: true, inboxItemId: askInbox.id },
  });
  await db.inboxItem.create({
    data: {
      type: "call_to_review", title: "Review Sam's call with Meridian Hotels",
      body: "Sam's best score yet (61). The client mentioned a loyalty app and an expansion into Ireland.",
      priority: 50, sourceCallId: rep[5].id,
    },
  });

  // Opportunities
  const oppMoment = (c: Created) => (c.moments.find((m) => m.type === "buying_signal") ?? c.moments.at(-1)!).id;
  const opportunities: Prisma.OpportunityCreateManyInput[] = [
    { callId: rep[5].id, momentId: oppMoment(rep[5]), description: "Loyalty app next year", owner: FOUNDER.name, nextStep: "Send a short note on the loyalty app", dueDate: new Date(now + 5 * DAY), valueEstimate: 40000, stage: "spotted" },
    { callId: rep[5].id, momentId: oppMoment(rep[5]), description: "Expansion into Ireland", owner: FOUNDER.name, nextStep: "Intro call with their Irish GM", dueDate: new Date(now + 12 * DAY), valueEstimate: 25000, stage: "in_conversation" },
    { callId: rep[1].id, momentId: oppMoment(rep[1]), description: "New clinic site in the spring", owner: FOUNDER.name, nextStep: "Proposal walkthrough", dueDate: new Date(now + 3 * DAY), valueEstimate: 18000, stage: "proposal_sent" },
    { callId: rep[3].id, momentId: oppMoment(rep[3]), description: "Driver recruitment campaign", owner: FOUNDER.name, nextStep: "Kick-off", dueDate: new Date(now - 2 * DAY), valueEstimate: 12000, stage: "won", finalValue: 12500, closedAt: new Date(now - 4 * DAY) },
  ];
  await db.opportunity.createMany({ data: opportunities });

  const avg = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
  console.log(`Seeded ${founder.length} founder calls and ${rep.length} rep calls (agency domain ${AGENCY_DOMAIN}).`);
  console.log(`Rep baseline ${avg(rep.slice(0, 5).map((c) => c.total))}, latest ${rep[5].total}; H13 streak ${h13Streak.filter(Boolean).length} of ${h13Streak.length}.`);
  console.log(`Founder scores: ${founder.map((c) => c.total).join(", ")}; rep scores: ${rep.map((c) => c.total).join(", ")}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
