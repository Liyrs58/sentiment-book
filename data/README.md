Sample-corpus dumps belong here.

- `pipeline-cache.json` is the committed HARLF corpus snapshot (weights, sample
  scores, session). The desk uses it when `@vercel/blob` is unset so serverless
  `/tmp` is not the only store. `npm run pipeline` rewrites it.
- `finbert-cache.json` is produced by `npm run score:finbert` and is gitignored.
