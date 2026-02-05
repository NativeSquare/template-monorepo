"use client";

import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import {
  IconArrowLeft,
  IconUserShield,
  IconUser,
  IconTrash,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
  role: z.enum(["user", "admin"]),
});

interface UserDetailProps {
  userId: Id<"users">;
}

export function UserDetail({ userId }: UserDetailProps) {
  const router = useRouter();
  const user = useQuery(api.table.admin.getUser, { userId });
  const updateUser = useMutation(api.table.admin.updateUser);
  const deleteUser = useMutation(api.table.admin.deleteUser);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      bio: "",
      role: "user",
    },
  });

  // Update form values when user data loads
  React.useEffect(() => {
    if (user) {
      form.reset({
        name: user.name ?? "",
        bio: user.bio ?? "",
        role: user.role ?? "user",
      });
    }
  }, [user, form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await updateUser({
        userId,
        updates: {
          name: data.name || undefined,
          bio: data.bio || undefined,
          role: data.role,
        },
      });
      toast.success("User updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update user"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteUser({ userId });
      toast.success("User deleted successfully");
      router.push("/team");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete user"
      );
      setIsDeleting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (user === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">User not found</p>
        <Button variant="outline" onClick={() => router.push("/team")}>
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Back to Team
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/team")}
        >
          <IconArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{user.name || "Unnamed User"}</h1>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
        <Badge
          variant={user.role === "admin" ? "default" : "outline"}
          className="capitalize"
        >
          {user.role === "admin" ? (
            <IconUserShield className="mr-1 h-3 w-3" />
          ) : (
            <IconUser className="mr-1 h-3 w-3" />
          )}
          {user.role || "user"}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Created</span>
                <p className="font-medium">{formatDate(user._creationTime)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email Verified</span>
                <p className="font-medium">
                  {user.emailVerificationTime
                    ? formatDate(user.emailVerificationTime)
                    : "Not verified"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Phone</span>
                <p className="font-medium">{user.phone || "Not set"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Onboarding</span>
                <p className="font-medium">
                  {user.hasCompletedOnboarding ? "Completed" : "Not completed"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Edit User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input {...field} id="name" placeholder="User's name" />
                  </div>
                )}
              />

              <Controller
                name="bio"
                control={form.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      {...field}
                      id="bio"
                      placeholder="User's bio"
                      rows={3}
                    />
                  </div>
                )}
              />

              <Controller
                name="role"
                control={form.control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete User</p>
              <p className="text-muted-foreground text-sm">
                Permanently delete this user and all their data.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  <IconTrash className="mr-2 h-4 w-4" />
                  Delete User
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this user? This action
                    cannot be undone. All user data, sessions, and associated
                    accounts will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? <Spinner className="mr-2 h-4 w-4" /> : null}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
