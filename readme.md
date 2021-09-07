# Exhausting A Crowd

Inspired by the classic 60-page piece of experimental literature from Georges Perec, "An Attempt at Exhausting a Place in Paris", written from a bench over three days in 1974. "Exhausting a Crowd" will automate the task of completely describing the events of 12 hours in a busy public space. This work speaks to the potential of a perfectly automated future of surveillance, enabled by a distributed combination of machine and human intelligence. A beautiful record of the energy present in shared space, as well as a disturbing look into the potential for control in a dystopian environment. Commissioned by the V&A for "[All of This Belongs to You](http://www.vam.ac.uk/content/exhibitions/all-of-this-belongs-to-you/)".

This piece builds on my previous work including "[People Staring at Computers](https://vimeo.com/25958231)" and "[keytweeter](https://vimeo.com/9922212)" which address the boundaries between public and private spaces, and the way computers mediate those spaces. Most similar is "[Conversnitch](https://twitter.com/conversnitch)" where I worked with [Brian House](https://twitter.com/h0use) to create a lamp that tweets overheard conversations in realtime using distributed human transcriptions. The potential for the hive mind to aide or disable investigations was made clear in the aftermath of the Boston marathon bombings, where [Reddit took to vigilantism](http://www.nytimes.com/2013/04/29/business/media/bombings-trip-up-reddit-in-its-turn-in-spotlight.html), trawling through thousands of images of the incident in an attempt to find the criminal, eventually settling on the wrong suspect.

In the work of others, I was inspired by David Rokeby's "[Sorting Daemon](www.davidrokeby.com/sorting.html)", Rafael Lozano-Hemmer's "[Subtitled Public](http://www.lozano-hemmer.com/subtitled_public.php)", Standish Lawder's "[Necrology](https://www.youtube.com/watch?v=Dadi7mw5gCs)". Late in the process of the developing the piece, someone shared "[The Girl Chewing Gum](https://www.youtube.com/watch?v=57hJn-nkKSA)" by John Smith which became more confirmation than inspiration. Another interesting reference a friend sent was ["An Attempt at Exhausting and Augmented Place in Paris." Georges Perec, observer-writer of urban life, as a mobile locative media user](http://www.i-3.fr/wp-content/uploads/2015/05/WP-i3-SES-15-07-Licoppe.pdf) by Christian Licoppe.

The primary location inspiring this piece was 14th Street Union Square in NYC, as viewed from the south side of the park. At any moment, there may be anywhere from 10 people at midnight, to 100 people on a cold afternoon, to 500 people at lunch or thousands for a protest. People are engaged in a variety of activities from playing chess, to dancing, singing, chanting, panhandling, eating, kissing, walking through, or just waiting.

![](https://igcdn-photos-d-a.akamaihd.net/hphotos-ak-xaf1/t51.2885-15/11378623_774063319380827_678750027_o.jpg)

The decision to go with Piccadilly Circus was at the request of the V&A to consider shooting in London. After exploring public spaces on street view and Wikipedia, I eventually found [this picture on Flickr](https://www.flickr.com/photos/mrandrewmurray/2765228320/) by Andrew Murray:

![](https://farm4.staticflickr.com/3280/2765228320_764394bc57_b.jpg)

After a lot of discussion with different businesses around Piccadilly Circus we eventually found Lillywhites (Sports Direct) was willing to let us shoot the piece.

Two big decisions were made throughout the project, one was about whether to present a live stream or a pre-recorded stream, and the other was about whether to use computer-assisted tags or even computer-assisted targets based on pedestrian detection. The pre-recorded stream was essential to get the effect of an abundance of notes at any moment, and we tried to create the feeling of it being "live" by removing almost all user interface elements that suggested otherwise. The computer-assisted tags were dropped because it felt more disturbing to know that all the notes left behind were left there by a real human clicking and typing.

With 4k footage there was some concern about privacy. Legally, there are no privacy restrictions on filming and broadcasting people in public spaces in the UK (with the exception of a few places like [The Royal Square, Trafalgar Square, the London Underground](http://filmlondon.org.uk/get-permission-film)). But this piece is about the crowd, not any specific individual, I wanted to avoid making any persons face clearly recognizable. In practice, almost all individuals appear at enough of a distance, and most internet connections cannot support the full 4k video bandwidth required to make out faces in the foreground.

## Technical details

All footage was recorded over 12 hours at 4k 30fps on a GoPro Hero 4, modified with a [12mm lens](http://peauproductions.com/store/index.php?main_page=product_info&products_id=690), and two [Lexar 64GB High-speed MicroSD cards](http://www.bhphotovideo.com/c/product/1031506-REG/lexar_lsdmi64gbsbna633r_64gb_micro_sdhc_card.html) that were swapped every two hours while the GoPro ran off USB power. The GoPro outputs a sequence of short videos that are then stripped of audio and concatenated with `ffmpeg`. Before being concatenated the videos are copied to a temporary folder on the internal SSD which changes the processing time from days to minutes. Finally, all six videos (approximately two hours each) are uploaded to YouTube, which will accept up to 128GB or 11 hour videos after verification. All the videos are added to a playlist, and YouTube handles the streaming and buffering.

## Adding a new location

* Upload video and create a playlist for it.
* Add new location name to `index.js` (line 61)
* Toggle comments between line 64 and line 65 in `index.js` to redirect visitors to the new location.
* Add new location metadata to `typescript/frontend.ts` (line 9).
* Add new location to `public/index.html` in the `public_sites` variable.
* Create a new logo for the top right corner called `logo-site.png` where `site` is the name. It should be a white logo with transparent background in a PNG no more than 187px wide.
* Add credits to `public/index.html`.
* Run `tsc --outDir public/compiled/ typescript/*` to update TypeScript definitions. It will print an error, `not assignable to parameter of type 'PlayerOptions'.`, but it can be ignored.
* Edit the `res.redirect` for the root directory in `index.js`.

## Software details

The frontend is written with TypeScript, and is getting definitions with `tsd`. Install these with `npm install -g typescript@1.4 tsd@next`

Then, to run locally, you will need to modify the code to attach to the remote database.

```sh
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
$ nvm install 12.18.3
$ npm install -g typescript@1.4 tsd@0.31.1
$ npm install
$ tsc --outDir public/compiled/ typescript/*
$ npm start
```

The app should now be running on [localhost:5000](http://localhost:5000/).

To make TypeScript automatically recompile changes to the .ts definitions, run `tsc -w --outDir public/compiled/ typescript/*`.

If your computer is connected to AirPlay, the pause function is delayed (in order to sync the audio).

### Setting up on a fresh machine

Create an Ubuntu 20.04 machine and [create a non-root user and login as that user](https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-20-04) and enable ufw.

[Install PostgreSQL](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-postgresql-on-ubuntu-20-04):

```
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql@12-main
sudo -i -u postgres
createuser --interactive
# "kyle" and "y"
# ctrl-c
createdb exhausting
pg_dump "$DATABASE_URL" > dump.psql
psql exhausting < dump.psql
```

Pull the repo:

```
sudo apt update && sudo apt install -y git
git clone https://github.com/kylemcdonald/ExhaustingACrowd.git
```

Install and prepare Node:

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
nvm install 12.18.3
npm install -g typescript@1.4 tsd@next
cd ExhaustingACrowd
npm install
tsc --outDir public/compiled/ typescript/*
npm start # make sure it's working
```

Keep running with pm2, and [pm2 on startup](https://pm2.keymetrics.io/docs/usage/startup/):

```
npm install pm2 -g
pm2 start index.js
sudo env PATH=$PATH:/home/kyle/.nvm/versions/node/v12.18.3/bin /home/kyle/.nvm/versions/node/v12.18.3/lib/node_modules/pm2/bin/pm2 startup systemd -u kyle --hp /home/kyle
pm2 save
```

Install [nginx](https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-20-04):

```
sudo apt update
sudo apt install nginx
sudo ufw allow 'Nginx Full'
sudo cp .nginx /etc/nginx/sites-available/exhaustingacrowd.com
sudo ln -s /etc/nginx/sites-available/exhaustingacrowd.com /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

Setup the DNS A record and install and configure [Let's Encrypt](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-20-04):

```
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d exhaustingacrowd.com -d www.exhaustingacrowd.com
```

### Problems Building

* 2021-8-30 `tsd reinstall` yields `ReferenceError: primordials is not defined` in `fs.js:36`. Googling yields info about gulp and graceful-fs incompatibilities, but not using gulp here. Instead looked into `tsd` version as culprit, uninstalled `@next` and looked at [version history](https://www.npmjs.com/package/tsd). Picked version 0.17.0 instead, from 6/3/2021, 3 months ago, instead of `@next` which is 0.6.0-beta.5 from six years ago and seems very uncommonly used. Get the error `The type definition index.d.ts does not exist. Create one and try again.` and instead try 0.13.1 from 7/4/2020. Same issue. Finally realized I only need to use `tsc` not `tsd reinstall` and 0.13.1 worked fine.
* 2021-4-10 Currently on Node v12.18.3. After running `npm start` I saw the message `Error: Node Sass does not yet support your current environment: OS X 64-bit with Unsupported runtime`. Tried `npm rebuild node-sass`. Then saw the error `No Xcode or CLT version detected!`. Ran Xcode and let it install "additional components". Then ran `sudo xcode-select --reset` and ran `npm rebuild node-sass` again. Found [this explanation](https://github.com/nodejs/node-gyp/issues/1763) and tried upgrading `npm install node-sass@4.12.0 --save`. Seems like it didn't actually try upgrading. [Node support for node-sass](https://github.com/sass/node-sass#node-version-support-policy) says Node 12+ requires node-sass 4.12+. Tried adding `--force` flag. Installed the correct version, but `npm start` still failed. Switched to new machine, same Node version. Pulled repo and ran `npm install` from empty. `npm start` works. The original reason to try fixing this is that the notes weren't showing up anymore. But it works fine locally, which means there is a distinction between the Heroku and local versions. Turns out this can be fixed by setting the config variable `PGSSLMODE` to `require`. The hint was in the message `heroku "error: no pg_hba.conf entry for host"` and the side note: `"SSL off"`.

## Credits

These are the credits for the piece as it was initially created for London:

```
EXHAUSTING A CROWD (2015)
by KYLE MCDONALD
with JONAS JONGEJAN

COLLABORATION & SITE DEVELOPMENT / JONAS JONGEJAN
COMMISSIONED by VICTORIA AND ALBERT MUSEUM for ALL OF THIS BELONGS TO YOU
NICO TURNER / VIDEO
SPECIAL THANKS to CORINNA GARDNER, DAN JOYCE, HELLICAR & LEWIS
```
