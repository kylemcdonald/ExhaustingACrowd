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
        $('#transition').animate({
            opacity: "0"
        }, 200, () =>{
                $('#transition').hide();
                $('#loading').hide()
            }
        );
    }


    hideVideo(cb?:()=>void){
        console.log("Hide video");
        var e = $('#transition');

        e.show();

        e.animate({ opacity: "100" }, 1000, ()=>{
            if(cb) cb();
        })
    }

    showVideo(cb?:()=>void){
        console.log("show video");
        var e = $('#transition');
        e.animate({ opacity: "0" }, 1000, ()=>{
            $('#transition').hide();
            if(cb) cb();
        })
    }


    showCredits(){
        $('#overlay').animate({opacity:"0"},200);
        $('#credits')
            .show()
            .animate({opacity:"100"}, 500);
    }

    hideCredits(){
        var e = $('#credits');
        e.animate({ opacity: "0" }, 500, ()=>{
            $('#credits').hide();
        })
        $('#overlay').animate({opacity:"100"},500);

    }

}