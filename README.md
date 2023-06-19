# Cardset

A tool for custom card design and management for TCGs and other card games.

Cardset is a single-page web-app that treats sets of card like a rich text document, and allows for image exporting or cards, leveraging React, SlateJS, and modern-screenshot.

## Getting Started

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

### Usage

Focus a field to edit the text, drag and drop an image file to add an a card illustration, click "Save Card Image" to export current card to an image file.

## Contributing and Roadmap

I plan on working on this in my off-hours adding features as I go, no concrete roadmap but some basic features in my sights to contend with leading contemporaries:

* Editable/sortable card list
* Saving/loading sets
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
