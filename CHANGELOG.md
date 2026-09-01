# Changelog

## [0.3.0](https://github.com/stritti/nak-gesangbuch-beamer/compare/nak-gesangbuch-beamer-v0.2.0...nak-gesangbuch-beamer-v0.3.0) (2026-09-01)


### Features

* Dashboard-Startseite mit Steuerung, Bibliothek und Setlist ([f3601d0](https://github.com/stritti/nak-gesangbuch-beamer/commit/f3601d001dbc240841372955c5763b46bd4dee67))

## [0.2.0](https://github.com/stritti/nak-gesangbuch-beamer/compare/nak-gesangbuch-beamer-v0.1.0...nak-gesangbuch-beamer-v0.2.0) (2026-08-29)


### Features

* add automatic verse number generation for slides without explicit numbers ([4b50fb1](https://github.com/stritti/nak-gesangbuch-beamer/commit/4b50fb14bc977b2884f6604b8c0c190c0e7d14c3))
* add blackout mode when navigating past last slide ([515ba82](https://github.com/stritti/nak-gesangbuch-beamer/commit/515ba82e1f8dbd2bf1477c913addcd53ae1afe62))
* add book information to song components ([3b07dfb](https://github.com/stritti/nak-gesangbuch-beamer/commit/3b07dfb201e974e8b320a979ce7c2e285458def0))
* add full book names with abbreviations in book filter ([6107c15](https://github.com/stritti/nak-gesangbuch-beamer/commit/6107c159c7f887f7156e7d84c401587cac2dee31))
* add home button to ProjectionScreen with navigation functionality ([b6c9c0b](https://github.com/stritti/nak-gesangbuch-beamer/commit/b6c9c0b3a89e4df02acca3005f093eac3444158b))
* Add left-aligned lyrics and verse number display in ProjectionScreen ([18604d1](https://github.com/stritti/nak-gesangbuch-beamer/commit/18604d11ebe0122fe487d453321ed326ffc930aa))
* Add NAK logo watermark to ProjectionScreen ([8b8572f](https://github.com/stritti/nak-gesangbuch-beamer/commit/8b8572f80572eb745832c97a48aa57785ab92a6a))
* add NAK song import and parsing infrastructure ([6f61935](https://github.com/stritti/nak-gesangbuch-beamer/commit/6f619353bcb233c7023b21f2ee75c39a6fdaba62))
* add NAK songbook transformer and update song loading process ([10756a3](https://github.com/stritti/nak-gesangbuch-beamer/commit/10756a3733a90d9e5c255bddc1d6f74e6e22f52c))
* add projection functionality for songs and setlists ([237de8c](https://github.com/stritti/nak-gesangbuch-beamer/commit/237de8c5ab5b43b8343a2fea757d65955825f71a))
* add projection window settings and helper functions ([10262f4](https://github.com/stritti/nak-gesangbuch-beamer/commit/10262f47aeaea1d8b924b9027b4e4a744e29259d))
* add slide transition animation with fade and translate effects ([29f9490](https://github.com/stritti/nak-gesangbuch-beamer/commit/29f94900bd5dc657263ba7e56c2ad058b0e82d65))
* add song sorting by book ID and number ([be853ca](https://github.com/stritti/nak-gesangbuch-beamer/commit/be853ca727e77d3366c039dc2719aef4832ecac9))
* add song title and number display to projection screen ([44ea042](https://github.com/stritti/nak-gesangbuch-beamer/commit/44ea0427c95478f9bb9a77db2022ef951f6f9980))
* add song title and number to ProjectionScreen component ([04b5b9d](https://github.com/stritti/nak-gesangbuch-beamer/commit/04b5b9d6b1b96d221811949d5225d461ac9ce1cc))
* add support for projecting songs from library and setlists ([93321ab](https://github.com/stritti/nak-gesangbuch-beamer/commit/93321abfc11a5ac64fd043cc81956853353ff99f))
* add verse navigation with number display and keyboard jumping ([5bebc2f](https://github.com/stritti/nak-gesangbuch-beamer/commit/5bebc2f4b7cd6577676803d24fb7e41213264f6e))
* Adjust verse number buttons layout and add tooltip ([0d17779](https://github.com/stritti/nak-gesangbuch-beamer/commit/0d17779c6a538ccc0987cf43201eeefa96506d86))
* configure song data loading from configurable path ([cd20c2f](https://github.com/stritti/nak-gesangbuch-beamer/commit/cd20c2fb9e0618ba6a40e47561b12d109a9f3500))
* display entire song verses as single slides on projection screen ([c1698a9](https://github.com/stritti/nak-gesangbuch-beamer/commit/c1698a92e9c39f7e6f659d057a32da14782a1c02))
* enhance NAK import with book extraction and parsing improvements ([ffaedfd](https://github.com/stritti/nak-gesangbuch-beamer/commit/ffaedfd3c460c6a8ebed87d74d5593a5db43cd07))
* Enhance projector window management with single instance and consistent window handling ([740229a](https://github.com/stritti/nak-gesangbuch-beamer/commit/740229ac50176e220fcf215c1553c5701079d9cc))
* Implement enhanced projection control with separate window and communication between control and projector pages ([5cedbde](https://github.com/stritti/nak-gesangbuch-beamer/commit/5cedbdeeea0d88e33f86b24d65aed62cd10712f7))
* Implement single persistent projector window with dynamic updates ([dd5168c](https://github.com/stritti/nak-gesangbuch-beamer/commit/dd5168cc3bb1ac6d80dee801e78bf704056ee7ad))
* Implement single, consistent ProjectionScreen across app ([9e4d813](https://github.com/stritti/nak-gesangbuch-beamer/commit/9e4d8139cefba5cd0089ce2cb127ceacf0868129))
* improve projection screen with dynamic font sizing and slide splitting ([3de7245](https://github.com/stritti/nak-gesangbuch-beamer/commit/3de724508573deb38daff9cf2577136587e9301a))
* Improve text rendering to prevent verse truncation ([478079e](https://github.com/stritti/nak-gesangbuch-beamer/commit/478079e8cdf7f1ad83a254ac04a0921725dae593))
* optimize font scaling for 1024x768 screens with responsive sizing ([9ce651d](https://github.com/stritti/nak-gesangbuch-beamer/commit/9ce651dbf9bff2e73d5c94dc55883f5726e7669a))
* **pwa:** enable dev options, cache songs data and fix icon purpose ([d61db15](https://github.com/stritti/nak-gesangbuch-beamer/commit/d61db154863016957cc3fb0721e330e5887dbbaa))
* replace NAK logo with official church emblem ([f4f770c](https://github.com/stritti/nak-gesangbuch-beamer/commit/f4f770c08d92b100df6c9faebae11fb4b39c8df9))
* update NAK logo to official version with improved visibility ([e5b57c5](https://github.com/stritti/nak-gesangbuch-beamer/commit/e5b57c5e229a830a03190e7ad4b477b14daf1381))


### Bug Fixes

* address Codex review — release-gated deploy and resilient approval ([e74f176](https://github.com/stritti/nak-gesangbuch-beamer/commit/e74f176239f59e84cc413c9d666af7e6e1e9d1ee))
* bind dependabot auto-merge to verified head SHA ([b20e846](https://github.com/stritti/nak-gesangbuch-beamer/commit/b20e846f05e801a3749f329237adcf1393843739))
* **build:** reference Tailwind utilities in scoped styles ([21eb19a](https://github.com/stritti/nak-gesangbuch-beamer/commit/21eb19a8f3332df99c2230efa1087a77bb309cac))
* **ci:** exclude major updates from dependabot ([e54bda3](https://github.com/stritti/nak-gesangbuch-beamer/commit/e54bda3968c5292cf1efcba15001eccc1b842259))
* **ci:** make Dependabot labeling self-healing ([b60fad0](https://github.com/stritti/nak-gesangbuch-beamer/commit/b60fad00bb41b2270884d9f9eb78316dcd40d195))
* **ci:** skip commitlint for Dependabot PRs ([ee59d4d](https://github.com/stritti/nak-gesangbuch-beamer/commit/ee59d4d776f53213b5c3e05d04a6d0d5bd91789f))
* correct HTML structure in ProjectionScreen.vue ([cac5915](https://github.com/stritti/nak-gesangbuch-beamer/commit/cac59159e53629812420dede2c96fb2524424815))
* correct logo ([a00c5e2](https://github.com/stritti/nak-gesangbuch-beamer/commit/a00c5e296cc919957ea7d9d47153499e055314c2))
* enhance NAK songbook transformer to handle various data formats ([f742123](https://github.com/stritti/nak-gesangbuch-beamer/commit/f742123d573aa3af7330f01063bc3b03d0d8bd32))
* gate deploy and dependabot auto-merge on green CI Verify ([1e1ccac](https://github.com/stritti/nak-gesangbuch-beamer/commit/1e1ccaced9c69da0644886631b07dc83deeff919))
* handle metadata objects and generate titles in NAK song transformer ([aeb3a0d](https://github.com/stritti/nak-gesangbuch-beamer/commit/aeb3a0ddba54fa79795fbe1a65c6a8be5a3e3e20))
* improve font size adjustment for slide transitions with additional rendering checks ([1c92f82](https://github.com/stritti/nak-gesangbuch-beamer/commit/1c92f8269c73974cbd8f9c9e276f847ee7f5df4d))
* lint issues ([84b5330](https://github.com/stritti/nak-gesangbuch-beamer/commit/84b5330cfd590d5f59eaef1afb3f230e13977146))
* make router and projector urls base-path aware ([30a589f](https://github.com/stritti/nak-gesangbuch-beamer/commit/30a589fbefade6cb3da573e299e25e47c45396da))
* rediscover projector window on reopen, never open blank window on send ([ea5e182](https://github.com/stritti/nak-gesangbuch-beamer/commit/ea5e1826920219d23f2cca510ec05ab47f459826))
* reopen projector window with selected features ([c4bdfef](https://github.com/stritti/nak-gesangbuch-beamer/commit/c4bdfefb751c2a97bcdd32b03b7220d546b705e3))
* repair broken build, type and lint baseline ([0bf61fc](https://github.com/stritti/nak-gesangbuch-beamer/commit/0bf61fcd1ea8342084a933b7c222c63ca8f47e4f))
* replace export default with module.exports in .eslintrc.js ([f00790d](https://github.com/stritti/nak-gesangbuch-beamer/commit/f00790d86822127915c697199398b9c81a85cf4d))
* resolve JSON schema validation issues in song repository ([4e6e723](https://github.com/stritti/nak-gesangbuch-beamer/commit/4e6e723fc3cef9bbec479637277afc6d5370f468))
* Resolve lifecycle hook warnings in projection components ([4d887b0](https://github.com/stritti/nak-gesangbuch-beamer/commit/4d887b0ae51a979540b69aadb0662051069410c7))
* resolve recursive call stack issue in openProjectorWindow method ([6267911](https://github.com/stritti/nak-gesangbuch-beamer/commit/6267911d92946e732e6dba0281ef2c129d759c47))
* resolve undefined isProjectorOpen reference in ControlPage ([ef1bbd2](https://github.com/stritti/nak-gesangbuch-beamer/commit/ef1bbd2dbc59ede47f1fe2f695798f2b0af47bf3))
* resolve undefined isProjectorWindowOpen function in ControlPage ([f8e1fc8](https://github.com/stritti/nak-gesangbuch-beamer/commit/f8e1fc8e64415df587860c59bed2aaae16408ee0))
* resolve Vue lifecycle hook warnings in async setup ([cb4466b](https://github.com/stritti/nak-gesangbuch-beamer/commit/cb4466b07836eac753a40706795284bb10d754a2))
* resolve Vue prop default value hoisting issue in HotkeyLegend ([1b51c59](https://github.com/stritti/nak-gesangbuch-beamer/commit/1b51c59a9975ffd00d28f0479b3a632c6c16fe8b))
* resolve Vue script setup prop default value compilation error ([210526e](https://github.com/stritti/nak-gesangbuch-beamer/commit/210526e03fd79d53608312ec3fb3ab3c7221f21c))
* update ESLint config to use CommonJS module syntax ([5cc6e86](https://github.com/stritti/nak-gesangbuch-beamer/commit/5cc6e86d1beef3e813ff47ca3ee5a2fe04fe522f))
