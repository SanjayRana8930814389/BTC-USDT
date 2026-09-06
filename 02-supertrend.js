/*
========================================================
 FILE NO. 2
 02-supertrend.js

 SuperTrend Module
 यह File अकेले Chart को नहीं बदलेगी।
 बाद में 12-main.html इसे load करेगा।

 Features:
 - ATR Period
 - ATR Multiplier
 - Source
 - Bullish / Bearish Trend
 - BUY / SELL Signal
 - SuperTrend Value
========================================================
*/


(function () {

    "use strict";


    /* ====================================================
       DEFAULT SETTINGS
    ==================================================== */

    const SuperTrend = {

        settings: {

            atrPeriod: 10,

            multiplier: 3.0,

            source: "hl2"

        },


        /* =================================================
           SETTINGS UPDATE
        ================================================= */

        setSettings: function (newSettings) {

            if (!newSettings)
                return;

            if (
                Number.isFinite(
                    Number(newSettings.atrPeriod)
                )
            ) {

                this.settings.atrPeriod =
                    Math.max(
                        1,
                        Number(newSettings.atrPeriod)
                    );

            }


            if (
                Number.isFinite(
                    Number(newSettings.multiplier)
                )
            ) {

                this.settings.multiplier =
                    Math.max(
                        0.1,
                        Number(newSettings.multiplier)
                    );

            }


            if (newSettings.source) {

                this.settings.source =
                    newSettings.source;

            }

        },


        /* =================================================
           TRUE RANGE
        ================================================= */

        trueRange: function (
            current,
            previous
        ) {

            if (!previous) {

                return (
                    current.high -
                    current.low
                );

            }


            const a =
                current.high -
                current.low;


            const b =
                Math.abs(
                    current.high -
                    previous.close
                );


            const c =
                Math.abs(
                    current.low -
                    previous.close
                );


            return Math.max(
                a,
                b,
                c
            );

        },


        /* =================================================
           ATR
        ================================================= */

        calculateATR: function (
            candles,
            index,
            period
        ) {

            if (
                index < period - 1
            ) {

                return null;

            }


            let total = 0;


            const start =
                index -
                period +
                1;


            for (
                let i = start;
                i <= index;
                i++
            ) {

                const current =
                    candles[i];


                const previous =
                    i > 0
                    ? candles[i - 1]
                    : null;


                total +=
                    this.trueRange(
                        current,
                        previous
                    );

            }


            return (
                total /
                period
            );

        },


        /* =================================================
           SOURCE
        ================================================= */

        getSource: function (
            candle
        ) {

            switch (
                this.settings.source
            ) {

                case "close":

                    return candle.close;


                case "open":

                    return candle.open;


                case "high":

                    return candle.high;


                case "low":

                    return candle.low;


                case "hl2":

                default:

                    return (
                        candle.high +
                        candle.low
                    ) / 2;

            }

        },


        /* =================================================
           CALCULATE SUPERTREND
        ================================================= */

        calculate: function (
            candles
        ) {

            if (
                !Array.isArray(candles) ||
                candles.length === 0
            ) {

                return [];

            }


            const period =
                this.settings.atrPeriod;


            const multiplier =
                this.settings.multiplier;


            const result = [];


            let previousFinalUpper =
                null;


            let previousFinalLower =
                null;


            let previousTrend = 1;


            let previousClose =
                null;


            for (
                let i = 0;
                i < candles.length;
                i++
            ) {

                const candle =
                    candles[i];


                const atr =
                    this.calculateATR(
                        candles,
                        i,
                        period
                    );


                if (atr === null) {

                    result.push({

                        time:
                            candle.time,

                        atr:
                            null,

                        upper:
                            null,

                        lower:
                            null,

                        supertrend:
                            null,

                        trend:
                            null,

                        buy:
                            false,

                        sell:
                            false

                    });


                    previousClose =
                        candle.close;

                    continue;

                }


                const source =
                    this.getSource(
                        candle
                    );


                /* -----------------------------------------
                   BASIC BANDS
                ----------------------------------------- */

                const basicUpper =
                    source +
                    multiplier *
                    atr;


                const basicLower =
                    source -
                    multiplier *
                    atr;


                /* -----------------------------------------
                   FINAL BANDS
                ----------------------------------------- */

                let finalUpper =
                    basicUpper;


                let finalLower =
                    basicLower;


                if (
                    previousFinalUpper !== null &&
                    previousClose !== null
                ) {

                    if (
                        basicUpper <
                        previousFinalUpper ||
                        previousClose >
                        previousFinalUpper
                    ) {

                        finalUpper =
                            basicUpper;

                    } else {

                        finalUpper =
                            previousFinalUpper;

                    }


                    if (
                        basicLower >
                        previousFinalLower ||
                        previousClose <
                        previousFinalLower
                    ) {

                        finalLower =
                            basicLower;

                    } else {

                        finalLower =
                            previousFinalLower;

                    }

                }


                /* -----------------------------------------
                   TREND
                ----------------------------------------- */

                let trend =
                    previousTrend;


                if (
                    previousFinalUpper !== null &&
                    previousFinalLower !== null
                ) {

                    if (
                        previousTrend === -1 &&
                        candle.close >
                        previousFinalUpper
                    ) {

                        trend = 1;

                    }

                    else if (
                        previousTrend === 1 &&
                        candle.close <
                        previousFinalLower
                    ) {

                        trend = -1;

                    }

                }


                /* -----------------------------------------
                   SUPERTREND VALUE
                ----------------------------------------- */

                let supertrend;


                if (trend === 1) {

                    supertrend =
                        finalLower;

                } else {

                    supertrend =
                        finalUpper;

                }


                /* -----------------------------------------
                   SIGNAL
                ----------------------------------------- */

                const buy =
                    trend === 1 &&
                    previousTrend === -1;


                const sell =
                    trend === -1 &&
                    previousTrend === 1;


                result.push({

                    time:
                        candle.time,

                    open:
                        candle.open,

                    high:
                        candle.high,

                    low:
                        candle.low,

                    close:
                        candle.close,

                    atr:
                        atr,

                    upper:
                        finalUpper,

                    lower:
                        finalLower,

                    supertrend:
                        supertrend,

                    trend:
                        trend,

                    buy:
                        buy,

                    sell:
                        sell

                });


                previousFinalUpper =
                    finalUpper;


                previousFinalLower =
                    finalLower;


                previousTrend =
                    trend;


                previousClose =
                    candle.close;

            }


            return result;

        },


        /* =================================================
           LAST SIGNAL
        ================================================= */

        getLastSignal: function (
            data
        ) {

            if (
                !Array.isArray(data) ||
                data.length === 0
            ) {

                return null;

            }


            for (
                let i = data.length - 1;
                i >= 0;
                i--
            ) {

                if (data[i].buy) {

                    return {

                        type: "BUY",

                        index: i,

                        price:
                            data[i].close,

                        time:
                            data[i].time,

                        supertrend:
                            data[i].supertrend

                    };

                }


                if (data[i].sell) {

                    return {

                        type: "SELL",

                        index: i,

                        price:
                            data[i].close,

                        time:
                            data[i].time,

                        supertrend:
                            data[i].supertrend

                    };

                }

            }


            return null;

        },


        /* =================================================
           CURRENT TREND
        ================================================= */

        getCurrentTrend: function (
            data
        ) {

            if (
                !Array.isArray(data) ||
                data.length === 0
            ) {

                return null;

            }


            const last =
                data[data.length - 1];


            if (
                last.trend === 1
            ) {

                return "BULLISH";

            }


            if (
                last.trend === -1
            ) {

                return "BEARISH";

            }


            return null;

        }

    };


    /* ====================================================
       GLOBAL MODULE
    ==================================================== */

    window.SuperTrend =
        SuperTrend;


})();
