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
        $('#loading').animate({
            opacity: "0"
        }, 200, () =>{
                $('#transition').hide();
                $('#loading').hide();
                $('#loading').hide();
                $('#persistent').show();
            }
        );
    }


    hideVideo(cb?:()=>void){
        console.log("Hide video");
        $('#videocontainer').addClass('blur');;
        $('#transition').show();
        /*e.show();

        e.animate({ opacity: "1" }, 1000, ()=>{
            if(cb) cb();
        })*/

        setTimeout(cb, 300);
    }

    showVideo(cb?:()=>void){
        console.log("show video");
        $('#videocontainer').removeClass('blur');
        $('#transition').hide();
        /*
        e.animate({ opacity: "0" }, 1000, ()=>{
            $('#transition').hide();
            if(cb) cb();
        })*/
        setTimeout(cb, 300);
    }


    showCredits(){
        $('#overlay').animate({opacity:"0"},200);
        $('#credits')
            .show()
            .animate({opacity:"1"}, 500);
    }

    hideCredits(){
        var e = $('#credits');
        e.animate({ opacity: "0" }, 500, ()=>{
            $('#credits').hide();
        })
        $('#overlay').animate({opacity:"1"},500);

    }

}