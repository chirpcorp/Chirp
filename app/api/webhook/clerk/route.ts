/* eslint-disable camelcase */
// Resource: https://clerk.com/docs/users/sync-data-to-your-backend
// Above article shows why we need webhooks i.e., to sync data to our backend

// Resource: https://docs.svix.com/receiving/verifying-payloads/why
// It's a good practice to verify webhooks. Above article shows why we should do it
import { Webhook, WebhookRequiredHeaders } from "svix";
import { headers } from "next/headers";

import { IncomingHttpHeaders } from "http";

import { NextResponse } from "next/server";
import {
  addMemberToCommunity,
  createCommunity,
  deleteCommunity,
  removeUserFromCommunity,
  updateCommunityInfo,
} from "@/lib/actions/community.actions";
import { fetchUser } from "@/lib/actions/user.actions";

// Resource: https://clerk.com/docs/integration/webhooks#supported-events
// Above document lists the supported events
type EventType =
  | "organization.created"
  | "organizationInvitation.created"
  | "organizationMembership.created"
  | "organizationMembership.deleted"
  | "organization.updated"
  | "organization.deleted";

type Event = {
  data: Record<string, string | number | Record<string, string>[]>;
  object: "event";
  type: EventType;
};

export const POST = async (request: Request) => {
  const payload = await request.json();
  const header = await headers();

  const heads = {
    "svix-id": header.get("svix-id"),
    "svix-timestamp": header.get("svix-timestamp"),
    "svix-signature": header.get("svix-signature"),
  };

  // Validate that all required headers are present
  if (!heads["svix-id"] || !heads["svix-timestamp"] || !heads["svix-signature"]) {
    return NextResponse.json(
      { message: "Missing required webhook headers" },
      { status: 400 }
    );
  }

  // Validate webhook secret is configured
  if (!process.env.NEXT_CLERK_WEBHOOK_SECRET) {
    console.error("NEXT_CLERK_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { message: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Activitate Webhook in the Clerk Dashboard.
  // After adding the endpoint, you'll see the secret on the right side.
  const wh = new Webhook(process.env.NEXT_CLERK_WEBHOOK_SECRET);

  let evnt: Event | null = null;

  try {
    evnt = wh.verify(
      JSON.stringify(payload),
      heads as IncomingHttpHeaders & WebhookRequiredHeaders
    ) as Event;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json({ message: "Invalid webhook signature" }, { status: 400 });
  }

  if (!evnt) {
    return NextResponse.json({ message: "Invalid event" }, { status: 400 });
  }

  const eventType: EventType = evnt.type;

  // Listen organization creation event
  if (eventType === "organization.created") {
    // Resource: https://clerk.com/docs/reference/backend-api/tag/Organizations#operation/CreateOrganization
    // Show what evnt?.data sends from above resource
    const { id, name, slug, logo_url, image_url, created_by } =
      evnt?.data ?? {};

    try {
      // Validate required fields
      if (!name || !slug || !created_by) {
        return NextResponse.json(
          { message: "Missing required organization data" },
          { status: 400 }
        );
      }

      // Find the user to get their MongoDB ObjectId
      const user = await fetchUser(created_by as string);
      if (!user) {
        console.error(`User not found for Clerk ID: ${created_by}`);
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 }
        );
      }

      // Use the new createCommunity interface
      await createCommunity({
        name: name as string,
        username: slug as string,
        description: "Organization created via Clerk",
        image: (logo_url || image_url || "/assets/community.svg") as string,
        creatorId: user._id.toString(),
        isPrivate: false,
        path: "/communities",
      });

      return NextResponse.json({ message: "Community created" }, { status: 201 });
    } catch (err) {
      console.error("Failed to create community:", err);
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
      );
    }
  }

  // Listen organization invitation creation event.
  // Just to show. You can avoid this or tell people that we can create a new mongoose action and
  // add pending invites in the database.
  if (eventType === "organizationInvitation.created") {
    try {
      // Resource: https://clerk.com/docs/reference/backend-api/tag/Organization-Invitations#operation/CreateOrganizationInvitation
      console.log("Invitation created", evnt?.data);

      return NextResponse.json(
        { message: "Invitation created" },
        { status: 201 }
      );
    } catch (err) {
      console.log(err);

      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
      );
    }
  }

  // Listen organization membership (member invite & accepted) creation
  if (eventType === "organizationMembership.created") {
    try {
      // Resource: https://clerk.com/docs/reference/backend-api/tag/Organization-Memberships#operation/CreateOrganizationMembership
      // Show what evnt?.data sends from above resource
      const { organization, public_user_data } = evnt?.data;
      console.log("created", evnt?.data);

      await addMemberToCommunity(
        (organization as any)?.id as string,
        (public_user_data as any)?.user_id as string
      );

      return NextResponse.json(
        { message: "Member added to community" },
        { status: 201 }
      );
    } catch (err) {
      console.log(err);

      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
      );
    }
  }

  // Listen member deletion event
  if (eventType === "organizationMembership.deleted") {
    try {
      // Resource: https://clerk.com/docs/reference/backend-api/tag/Organization-Memberships#operation/DeleteOrganizationMembership
      // Show what evnt?.data sends from above resource
      const { organization, public_user_data } = evnt?.data;
      console.log("removed", evnt?.data);

      await removeUserFromCommunity(
        (public_user_data as any)?.user_id as string,
        (organization as any)?.id as string
      );

      return NextResponse.json({ message: "Member removed" }, { status: 201 });
    } catch (err) {
      console.log(err);

      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
      );
    }
  }

  // Listen organization updation event
  if (eventType === "organization.updated") {
    try {
      // Resource: https://clerk.com/docs/reference/backend-api/tag/Organizations#operation/UpdateOrganization
      // Show what evnt?.data sends from above resource
      const { id, logo_url, name, slug } = evnt?.data;
      console.log("updated", evnt?.data);

      await updateCommunityInfo({
        communityId: id as string,
        name: name as string,
        username: slug as string,
        image: logo_url as string,
        adminId: "system", // System update, no specific admin
        path: "/communities",
      });

      return NextResponse.json({ message: "Community updated" }, { status: 201 });
    } catch (err) {
      console.log(err);

      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
      );
    }
  }

  // Listen organization deletion event
  if (eventType === "organization.deleted") {
    try {
      // Resource: https://clerk.com/docs/reference/backend-api/tag/Organizations#operation/DeleteOrganization
      // Show what evnt?.data sends from above resource
      const { id } = evnt?.data;
      console.log("deleted", evnt?.data);

      await deleteCommunity({
        communityId: id as string,
        creatorId: "system", // System deletion
        path: "/communities",
      });

      return NextResponse.json(
        { message: "Organization deleted" },
        { status: 201 }
      );
    } catch (err) {
      console.log(err);

      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
      );
    }
  }

  // Handle unrecognized event types
  console.log(`Unhandled event type: ${eventType}`);
  return NextResponse.json(
    { message: `Event type ${eventType} not implemented` },
    { status: 200 } // Return 200 to acknowledge receipt
  );
};
