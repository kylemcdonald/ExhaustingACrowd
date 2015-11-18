/// <reference path="../typings/tsd.d.ts" />
/// <reference path="global.ts" />

interface IInterfaceCallbacks {
    onResize?: (() => void);
}

class Interface {

    private events:IInterfaceCallbacks;

    constructor(events:IInterfaceCallbacks){
        this.events = events;

        $(window).resize(()=>{
            if(this.events.onResize) this.events.onResize();
        });
    }

    hideLoadingScreen(){
        $('#initial-spinner').animate({
            opacity: '0'
        }, 250);
        $('#loading').animate({
            opacity: "0"
        }, 1000, () =>{
                $('#transition').hide();
                $('#loading').hide();
                $('#persistent').show();
            }
        );
    }


    hideVideo(cb?:()=>void){
        var e = $('#persistent-spinner');
        e.show();
        e.animate({ opacity: "1" }, 250, ()=>{
            $('#videocontainer').addClass('blur');
            setTimeout(cb, 250);
        })
    }

    showVideo(cb?:()=>void){
        var e = $('#persistent-spinner');
        e.animate({ opacity: "0" }, 250, ()=>{
            e.hide();
            $('#videocontainer').removeClass('blur');
            setTimeout(cb, 250);
        })
    }


    showCredits(){
        $('#overlay').animate({opacity:"0"},250);
        $('#linedrawing').animate({opacity:"0"},250);
        $('#credits')
            .show()
            .animate({opacity:"1"}, 500);
    }

    hideCredits(){
        var e = $('#credits');
        e.animate({ opacity: "0" }, 500, ()=>{
            $('#credits').hide();
        });
        $('#overlay').animate({opacity:"1"},500);
        $('#linedrawing').animate({opacity:"1"},500);

    }

}