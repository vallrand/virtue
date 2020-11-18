import {DemoGame} from './demo'

export default function(){
    window.start = _ => V.init().pipe(app => DemoGame(window.app = app)).fix(error => console.error(error))
    start()
//    V.init().pipe(app => {
//        DemoGame(window.app = app)
//    }).fix(error => console.error(error))
}