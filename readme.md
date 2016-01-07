# Exhausting A Crowd

Inspired by the classic 60-page piece of experimental literature from Georges Perec, “An Attempt at Exhausting a Place in Paris”, written from a bench over three days in 1974. “Exhausting a Crowd” will automate the task of completely describing the events of 12 hours in a busy public space. This work speaks to the potential of a perfectly automated future of surveillance, enabled by a distributed combination of machine and human intelligence. A beautiful record of the energy present in shared space, as well as a disturbing look into the potential for control in a dystopian environment. Commissioned by the V&A for "[All of This Belongs to You](http://www.vam.ac.uk/content/exhibitions/all-of-this-belongs-to-you/)".

This piece builds on my previous work including "[People Staring at Computers](https://vimeo.com/25958231)" and "[keytweeter](https://vimeo.com/9922212)" which address the boundaries between public and private spaces, and the way computers mediate those spaces. Most similar is “[Conversnitch](https://twitter.com/conversnitch)” where I worked with [Brian House](https://twitter.com/h0use) to create a lamp that tweets overheard conversations in realtime using distributed human transcriptions. The potential for the hive mind to aide or disable investigations was made clear in the aftermath of the Boston marathon bombings, where [Reddit took to vigilantism](http://www.nytimes.com/2013/04/29/business/media/bombings-trip-up-reddit-in-its-turn-in-spotlight.html), trawling through thousands of images of the incident in an attempt to find the criminal, eventually settling on the wrong suspect.

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

## Software details

The frontend is written with TypeScript, and is getting definitions with `tsd`. Install these with `npm install -g typescript@1.4 tsd@next`

Then, to run locally, execute:

```sh
$ npm install
$ tsd reinstall
$ npm start
```

The app should now be running on [localhost:5000](http://localhost:5000/).

To make TypeScript automatically recompile changes to the .ts definitions, run `tsc -w --outDir public/compiled/ typescript/*`.

To attach to the remote database, you will need to set the `DATABASE_URL` and `export PGSSLMODE='require'`. After making changes you can deploy to Heroku:

```sh
$ git push heroku master
$ heroku open
```

If your computer is connected to AirPlay, the pause function is delayed (in order to sync the audio).

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
