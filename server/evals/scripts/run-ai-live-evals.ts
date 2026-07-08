if (process.env.AI_EVAL_LIVE !== 'true') {
  console.log('Live AI evals are disabled. Set AI_EVAL_LIVE=true to run provider-backed evals.');
  process.exit(0);
}

console.error('Live AI evals are not implemented yet. Use npm run eval:ai:local for the CI gate.');
process.exit(1);
