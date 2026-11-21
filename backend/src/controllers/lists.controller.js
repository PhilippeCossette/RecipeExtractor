import {
  addRecipeToList,
  createList,
  deleteList,
  getList,
  getMyLists,
  removeRecipeFromList,
  updateList,
} from "../services/lists/index.js";

// requireAuth sets req.user; validate() puts the checked input in req.valid.
// A list the user can't see answers 404, the same as one that doesn't exist.
const notFound = (res) => res.status(404).json({ error: "List not found" });

/** GET /lists */
export async function listListsController(req, res) {
  res.json({ lists: await getMyLists(req.user.id) });
}

/** POST /lists { name, description? } */
export async function createListController(req, res) {
  res.status(201).json({ list: await createList(req.user.id, req.valid.body) });
}

/** GET /lists/:id */
export async function getListController(req, res) {
  const list = await getList(req.user.id, req.valid.params.id);
  if (!list) return notFound(res);
  res.json({ list });
}

/** PATCH /lists/:id { name?, description? } */
export async function updateListController(req, res) {
  const list = await updateList(req.user.id, req.valid.params.id, req.valid.body);
  if (!list) return notFound(res);
  res.json({ list });
}

/** DELETE /lists/:id (the recipes stay saved) */
export async function deleteListController(req, res) {
  if (!(await deleteList(req.user.id, req.valid.params.id))) return notFound(res);
  res.status(204).end();
}

/** PUT /lists/:id/recipes/:recipeId (adding twice is fine) */
export async function addRecipeToListController(req, res) {
  const { id, recipeId } = req.valid.params;
  const result = await addRecipeToList(req.user.id, id, recipeId);
  if (!result) return notFound(res);
  res.status(result.added ? 201 : 200).json(result);
}

/** DELETE /lists/:id/recipes/:recipeId */
export async function removeRecipeFromListController(req, res) {
  const { id, recipeId } = req.valid.params;
  const result = await removeRecipeFromList(req.user.id, id, recipeId);
  if (!result) return notFound(res);
  res.status(204).end();
}
