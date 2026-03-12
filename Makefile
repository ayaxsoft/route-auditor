.DEFAULT_GOAL := help
help:
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z0-9_-]+:.*?##/ { printf "  \033[36m%-27s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ [Macros] Make macros and aliases
.PHONY: reinstall
reinstall: ## Reinstall the project dependencies
	@echo "Reinstalling project dependencies..."
	rm -rf node_modules
	rm -rf pnpm-lock.yaml
	rm -rf packages/*/node_modules
	rm -rf packages/*/dist
	pnpm install