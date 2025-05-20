PACK_PATH = "splashindicator@ochi12.github.com.zip"
EXTENSION_DIR = "splashindicator@ochi12.github.com"

all: build install

.PHONY: build install clean

build:
	rm -f $(PACK_PATH)
	cd $(EXTENSION_DIR); \
	gnome-extensions pack --extra-source=icons/; \
	mv $(EXTENSION_DIR).shell-extension.zip ../$(PACK_PATH)

install:
	gnome-extensions install $(PACK_PATH) --force

clean:
	@rm -fv $(PACK_PATH)

