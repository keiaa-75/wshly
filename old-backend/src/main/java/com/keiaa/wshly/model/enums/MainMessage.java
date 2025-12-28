package com.keiaa.wshly.model.enums;

public enum MainMessage {
    MERRY_CHRISTMAS("Merry Christmas!"),
    HAPPY_HOLIDAYS("Happy Holidays!"),
    SEASONS_GREETINGS("Season's Greetings!"),
    HAPPY_NEW_YEAR("Happy New Year!"),
    WARM_WISHES("Warm Holiday Wishes!"),
    JOY_AND_PEACE("Wishing You Joy & Peace");

    private final String displayText;

    MainMessage(String displayText) {
        this.displayText = displayText;
    }

    public String getDisplayText() {
        return displayText;
    }
}
