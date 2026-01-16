/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1219621782")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1219621782")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = user",
    "deleteRule": "@request.auth.id = user",
    "updateRule": "@request.auth.id = user"
  }, collection)

  return app.save(collection)
})
