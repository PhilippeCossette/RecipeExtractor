import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ListForm } from "@/components/lists/ListForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDeleteList, useList, useSetRecipeInList, useUpdateList } from "@/hooks/useLists";

export const Route = createFileRoute("/_authed/lists/$listId")({
  component: ListPage,
});

/** One list: its recipes, rename / describe it, take recipes out, delete it. */
function ListPage() {
  const { listId } = Route.useParams();
  const list = useList(listId);
  const update = useUpdateList(listId);
  const remove = useSetRecipeInList();
  const [editing, setEditing] = useState(false);
  const l = list.data;

  return (
    <div className="flex flex-col gap-4">
      <Link to="/lists" className="text-muted-foreground text-sm hover:underline">
        ← Lists
      </Link>
      {list.isPending ? <p className="text-muted-foreground text-sm">Loading...</p> : null}
      {list.isError ? <p className="text-destructive text-sm">{list.error.message}</p> : null}

      {l ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold">{l.name}</h1>
              {l.description ? <p className="text-muted-foreground text-sm">{l.description}</p> : null}
            </div>
            {l.permissions.edit ? (
              <div className="flex gap-2">
                <Dialog open={editing} onOpenChange={setEditing}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit list</DialogTitle>
                    </DialogHeader>
                    <ListForm
                      initial={{ name: l.name, description: l.description ?? "" }}
                      submitLabel="Save"
                      onSave={(values) => update.mutateAsync(values)}
                      onDone={() => setEditing(false)}
                    />
                  </DialogContent>
                </Dialog>
                {l.permissions.isOwner ? <DeleteListButton listId={l.id} name={l.name} /> : null}
              </div>
            ) : null}
          </div>

          {l.recipes.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No recipes in this list yet. Open a recipe and use "Add to list".{" "}
              <Link to="/dashboard" className="underline">
                Your recipes
              </Link>
            </p>
          ) : null}

          <ul className="flex flex-col gap-2">
            {l.recipes.map((recipe) => (
              <li key={recipe.id}>
                <Card className="py-3">
                  <CardContent className="flex items-center gap-3">
                    {recipe.image ? (
                      <img src={recipe.image} alt="" className="size-12 shrink-0 rounded-md object-cover" />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <Link to="/recipes/$recipeId" params={{ recipeId: recipe.id }} className="font-medium hover:underline">
                        {recipe.title}
                      </Link>
                      <p className="text-muted-foreground truncate text-xs">{recipe.siteName ?? "Recipe"}</p>
                    </div>
                    {l.permissions.edit ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={remove.isPending && remove.variables?.recipeId === recipe.id}
                        onClick={() => remove.mutate({ listId: l.id, recipeId: recipe.id, inList: false })}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

/** Delete with a confirmation popup. The recipes stay saved. */
function DeleteListButton({ listId, name }: { listId: string; name: string }) {
  const navigate = useNavigate();
  const del = useDeleteList({ leave: () => navigate({ to: "/lists" }) });
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete "{name}"?</DialogTitle>
          <DialogDescription>The list goes away. Its recipes stay in your saved recipes.</DialogDescription>
        </DialogHeader>
        {del.isError ? <p className="text-destructive text-sm">{del.error.message}</p> : null}
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={del.isPending}
            onClick={() => del.mutate(listId)}
          >
            {del.isPending ? "Deleting..." : "Delete list"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
