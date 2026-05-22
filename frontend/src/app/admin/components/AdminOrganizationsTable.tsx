"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { AdminOrganizationSchema } from "common";
import { createClient } from "@/utils/supabase/client";
import { mutationFetch } from "@/lib/fetcher";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, ShieldX } from "lucide-react";

type Organization = z.infer<typeof AdminOrganizationSchema>;

interface AdminOrganizationsTableProps {
  organizations: Organization[];
}

export default function AdminOrganizationsTable({
  organizations,
}: AdminOrganizationsTableProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAuthorize = async (orgId: string, authorized: boolean) => {
    setLoadingId(orgId);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Session expired. Please sign in again.");
        return;
      }

      await mutationFetch(`/admin/organizations/${orgId}/authorize`, {
        method: "POST",
        token: session.access_token,
        body: { authorized },
      });

      toast.success(
        authorized ? "Organization approved" : "Organization approval revoked",
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update organization",
      );
    } finally {
      setLoadingId(null);
    }
  };

  const pending = organizations.filter((org) => !org.authorized);
  const approved = organizations.filter((org) => org.authorized);

  const renderTable = (orgs: Organization[]) => {
    if (orgs.length === 0) {
      return (
        <p className="text-muted-foreground text-sm py-8 text-center">
          No organizations found.
        </p>
      );
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Admins</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgs.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">{org.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {org.admins.map((a) => a.email).join(", ")}
                </TableCell>
                <TableCell>
                  {org.authorized ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      Approved
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(org.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  {org.authorized ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loadingId === org.id}
                      onClick={() => handleAuthorize(org.id, false)}
                      className="gap-1.5"
                    >
                      <ShieldX className="h-4 w-4" />
                      Revoke
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={loadingId === org.id}
                      onClick={() => handleAuthorize(org.id, true)}
                      className="gap-1.5"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Approve
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Tabs defaultValue="pending">
      <TabsList>
        <TabsTrigger value="pending">
          Pending ({pending.length})
        </TabsTrigger>
        <TabsTrigger value="approved">
          Approved ({approved.length})
        </TabsTrigger>
        <TabsTrigger value="all">
          All ({organizations.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="pending">{renderTable(pending)}</TabsContent>
      <TabsContent value="approved">{renderTable(approved)}</TabsContent>
      <TabsContent value="all">{renderTable(organizations)}</TabsContent>
    </Tabs>
  );
}
