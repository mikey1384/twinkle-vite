# Build Mobile Preview Lifecycle Checkpoints

From current state:

- [x] Phase 1 done: mobile Build workspace still uses the existing Chat/Preview UI, but preview activity is no longer tied only to CSS visibility.

- [x] Phase 2 done: mobile Chat tab immediately backgrounds the preview runtime, and Preview tab immediately reactivates it.

- [x] Phase 3 done: mobile preview hard-suspends after staying hidden briefly, then restores from React-owned build/project state when reopened.

- [x] Phase 4 done: tab switching no longer causes avoidable heavy React recalculation or iframe lifecycle churn.

- [x] Phase 5 done: Build runtime, thumbnail capture, project editing, runtime uploads, and runtime observation flows still work with the lifecycle boundary.

- [x] Final phase done: generated preview apps are isolated enough that heavy or broken preview code cannot freeze the Build editor UI.
