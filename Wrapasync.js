let ExpressError=require('./ExpressError')
function WrapAsync(fn) {
    return (req, res, next) => {
        fn(req, res, next).catch((err) => {
            let { status = 500, message = "something went wrong" } = err;

            return next(new ExpressError(status, message))
        })
    }

}

module.exports=WrapAsync;