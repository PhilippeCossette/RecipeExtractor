import { Link, createFileRoute } from "@tanstack/react-router";
import { ListForm } from "@/components/lists/ListForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateList, useLists } from "@/hooks/useLists";

export const Route = createFileRoute("/_authed/lists/")({
  component: ListsPage,
});

/** The user's lists, and a form to create one. */
function ListsPage() {
  const lists = useLists();
  const create = useCreateList();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Lists</h1>

      <Card>
        <CardHeader>
          <CardTitle>New list</CardTitle>
        </CardHeader>
        <CardContent>
          <ListForm submitLabel="Create list" onSave={(values) => create.mutateAsync(values)} />
        </CardContent>
      </Card>

      {lists.isPending ? <p className="text-muted-foreground text-sm">Loading...</p> : null}
      {lists.isError ? <p className="text-destructive text-sm">{lists.error.message}</p> : null}
      {lists.data?.length === 0 ? (
        <p className="text-muted-foreground text-sm">No lists yet. Make one above, then add recipes from their page.</p>
      ) : null}

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {lists.data?.map((list) => (
          <li key={list.id}>
            <Link to="/lists/$listId" params={{ listId: list.id }} className="block">
              <Card className="hover:bg-muted/50 py-3">
                <CardContent className="flex items-center gap-3">
                  {list.coverImage ? (
                    <img src={list.coverImage} alt="" className="size-14 shrink-0 rounded-md object-cover" />
                  ) : (
                    <div className="bg-muted size-14 shrink-0 rounded-md" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium">{list.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {list.recipeCount} {list.recipeCount === 1 ? "recipe" : "recipes"}
                      {list.description ? ` · ${list.description}` : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
