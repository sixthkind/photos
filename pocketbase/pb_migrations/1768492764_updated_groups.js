/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  let collection
  try {
    collection = app.findCollectionByNameOrId("groups")
  } catch (error) {
    return
  }

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = user",
    "listRule": "",
    "viewRule": ""
  }, collection)

  return app.save(collection)
}, (app) => {
  let collection
  try {
    collection = app.findCollectionByNameOrId("groups")
  } catch (error) {
    return
  }

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != ''",
    "listRule": "@request.auth.id = user",
    "viewRule": "@request.auth.id = user"
  }, collection)

  return app.save(collection)
})
