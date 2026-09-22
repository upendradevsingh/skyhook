import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/skyhook/landing";

export const Route = createFileRoute("/")({ component: LandingPage });
