# Cardset

A tool for custom card design and management for TCGs and other card games.

Cardset is a single-page web-app that treats sets of card like a rich text document, and allows for image exporting or cards, leveraging React, SlateJS, and html-to-image.

## Usage

You can try Cardset at <https://nabbydude.github.io/cardset/>

As of writing you can:

- Focus a field to edit text
- Style text with bold and italics
- Undo/Redo all actions
- Drag-and-drop an image file to add as a card illustration
- Add and delete cards
- Export the current card to an image file
- Save and load sets (:warning: saving and loading between updates is currently not supported and currently updates are frequent and without warning. This feature is just for testing. :warning:)

## Development

How to set up a cardset dev environment.

### Prerequisites

Cardset is written in typescript, runs on node js, and uses pnpm as a package manager.

If you have npm and need pnpm, it can be installed with the following command:

```
npm install -g pnpm
```

### Installation

1. Clone the repo:

	```
	git clone https://github.com/nabbydude/cardset.git
	```

2. Install dependencies:

	```
	pnpm install
	```

### Testing

Run a local server in watch mode:

```
pnpm dev
```

## Contributing and Roadmap

I plan on working on this in my off-hours adding features as I go, no concrete roadmap but some basic features in my sights to contend with leading contemporaries:

* Editable/sortable card list
* More rich text features and field types
	* Symbols in text
	* Automatic snippets
	* Modal choice options
	* Non-visible card fields
	* Field inferencing/override
* Multi-card export
* Becoming game agnostic and extensible
* Intra-set information like keywords
* Set statistics
* Proper mobile device support

I'm open to collaboration and contributions, please feel free to @ me in the Custom Magic Discord.
