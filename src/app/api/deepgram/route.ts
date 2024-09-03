import { DeepgramError, createClient } from "@deepgram/sdk";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // exit early so we don't request 70000000 keys while in devmode
  if (process.env.NODE_ENV === "development") {
    return NextResponse.json({
      key: process.env.DEEPGRAM_API_KEY ?? "",
    });
  }

  const deepgram = createClient(process.env.DEEPGRAM_API_KEY ?? "");

  let { result: projectsResult, error: projectsError } = await deepgram.manage.getProjects();

  if (projectsError) {
    return NextResponse.json(projectsError);
  }

  const project = projectsResult?.projects[0];

  if (!project) {
    return NextResponse.json(
      new DeepgramError("Cannot find a Deepgram project. Please create a project first.")
    );
  }

  let { result: newKeyResult, error: newKeyError } = await deepgram.manage.createProjectKey(
    project.project_id,
    {
      comment: "Temporary API key",
      scopes: ["usage:write"],
      tags: ["next.js"],
      time_to_live_in_seconds: 60,
    }
  );

  if (newKeyError) {
    return NextResponse.json(newKeyError);
  }

  return NextResponse.json(newKeyResult, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
