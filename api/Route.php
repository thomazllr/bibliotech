<?php

#[Attribute(Attribute::TARGET_FUNCTION | Attribute::TARGET_METHOD)]
class Route
{
    public string $path;
    public array $methods;

    public function __construct(string $path, array $methods = ['GET'])
    {
        $this->path = $path;
        $this->methods = $methods;
    }
}
