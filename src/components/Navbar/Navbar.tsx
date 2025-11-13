"use client";

import { Group, Text, Image } from "@mantine/core";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Navbar() {
  return (
    <div className="w-full h-16 bg-white border-b shadow-sm flex items-center">
      <div className="px-4 w-full flex items-center justify-between">
        {/* Left: Logo + Title */}
        <Group gap="sm" align="center">
          <Image src="/wckc_logo.png" alt="Woodcraft Logo" h={40} w="auto" />

          <Text fw={700} size="lg">
            Woodcraft Kitchen Cabinets
          </Text>
        </Group>

        {/* Right: Clerk User Menu */}
        <Group gap="sm">
          <SignedOut>
            <SignInButton />
          </SignedOut>
          <SignedIn>
            <UserButton showName={true} />
          </SignedIn>
        </Group>
      </div>
    </div>
  );
}
