declare class Events {
    private host;
    constructor(host: any);
    trigger(event: string | Event, detail?: any, ev?: Event): any;
}
export default Events;
