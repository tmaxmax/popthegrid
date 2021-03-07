export default <T>(arg: T | undefined): arg is T => typeof arg !== 'undefined'
