.PHONY: install dev build typecheck lint format

install:
	bun install

dev:
	bun run dev

build:
	bun run build

typecheck:
	bunx tsc --noEmit

lint:
	bun run lint

format:
	bun run eslint . --fix
